import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'
import { message } from 'ant-design-vue'
import { isApiSuccessCode, type ApiResponse } from '@/types/common'
import { clearStoredToken, getStoredToken } from '@/utils/tokenStorage'

const request: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL as string,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
})

/** 未授权业务码：body.code 或 HTTP 401 均视为需重新登录（登录页除外） */
const UNAUTHORIZED_CODE = 401

/**
 * 扩展请求配置
 * `silent: true` 时失败不弹全局提示，由调用方自行降级（如注册页部门下拉拉不到时改手填）
 */
export interface RequestConfig extends AxiosRequestConfig {
  silent?: boolean
}

/** 读取本次请求是否要求静默失败 */
function isSilentRequest(config: unknown): boolean {
  return (config as RequestConfig | undefined)?.silent === true
}

/** 判断当前是否在登录页（登录失败 401 不应清 token 并整页跳转） */
function isOnLoginPage(): boolean {
  return window.location.pathname === '/login'
}

/** 非登录页遇到 401：清 token 并跳转登录 */
function redirectToLogin(): void {
  clearStoredToken()
  window.location.href = '/login'
}

/** 从 axios 错误对象中提取后端 message / code */
function parseErrorBody(error: unknown): { code?: number; message?: string } {
  const data = (error as { response?: { data?: ApiResponse<unknown> } })?.response?.data
  if (!data || typeof data !== 'object') return {}
  return { code: data.code, message: data.message }
}

// ─── Request interceptor ─────────────────────────────────────────────────────
request.interceptors.request.use(
  (config) => {
    const token = getStoredToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// ─── Response interceptor ────────────────────────────────────────────────────
request.interceptors.response.use(
  (response) => {
    const res = response.data as ApiResponse<unknown>
    // HTTP 2xx 但业务码非成功：全局弹错并 reject（成功码见 isApiSuccessCode）
    if (!isApiSuccessCode(res.code)) {
      if (!isSilentRequest(response.config)) {
        message.error(res.message || '操作失败')
      }
      if (res.code === UNAUTHORIZED_CODE && !isOnLoginPage()) {
        redirectToLogin()
      }
      return Promise.reject(new Error(res.message))
    }
    return res as never
  },
  (error) => {
    const status = error.response?.status as number | undefined
    const { code: bodyCode, message: backendMsg } = parseErrorBody(error)
    const onLoginPage = isOnLoginPage()
    const isAuthError = status === UNAUTHORIZED_CODE || bodyCode === UNAUTHORIZED_CODE

    const msg =
      isAuthError
        ? onLoginPage
          ? backendMsg ?? '用户名或密码错误'
          : backendMsg ?? '登录已过期，请重新登录'
        : status === 403
          ? backendMsg ?? '权限不足'
          : status === 404
            ? backendMsg ?? '请求资源不存在'
            : backendMsg ?? '网络异常，请稍后重试'

    if (!isSilentRequest(error.config)) {
      message.error(msg)
    }

    if (isAuthError && !onLoginPage) {
      redirectToLogin()
    }

    return Promise.reject(error)
  },
)

/**
 * 收窄后的请求方法类型：响应拦截器已把 AxiosResponse 解包为 ApiResponse<T>，
 * 这里让 get/post/put/delete 直接返回 Promise<T>，
 * api 函数按 `return request.get('/api/xxx')` 写即可通过 TS 检查（T 由函数返回类型上下文推断）
 */
interface RequestMethods {
  get<T = unknown>(url: string, config?: RequestConfig): Promise<T>
  post<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T>
  put<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T>
  patch<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T>
  delete<T = unknown>(url: string, config?: RequestConfig): Promise<T>
}

export default request as RequestMethods
export type { AxiosRequestConfig }
