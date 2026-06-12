import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'
import { message } from 'ant-design-vue'
import type { ApiResponse } from '@/types/common'
import { clearStoredToken, getStoredToken } from '@/utils/tokenStorage'

const request: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL as string,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
})

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
    // Business error (code !== 200)
    if (res.code !== 200) {
      message.error(res.message || '操作失败')
      return Promise.reject(new Error(res.message))
    }
    // Return the full ApiResponse so callers can access .data
    return res as never
  },
  (error) => {
    const status = error.response?.status
    const msg =
      status === 401 ? '登录已过期，请重新登录' :
      status === 403 ? '权限不足' :
      status === 404 ? '请求资源不存在' :
      error.response?.data?.message ?? '网络异常，请稍后重试'

    message.error(msg)

    if (status === 401) {
      clearStoredToken()
      window.location.href = '/login'
    }

    return Promise.reject(error)
  },
)

export default request
export type { AxiosRequestConfig }
