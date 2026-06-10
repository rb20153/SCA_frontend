import type { ApiResponse } from '@/types/common'
import type { UserInfo } from '@/stores/auth'
import { MOCK_REGISTERED_USERNAMES, mockLoginRes, mockCurrentUserRes } from '@/mock/modules/auth/users'

export interface LoginParams {
  username: string
  password: string
}

export interface RegisterParams {
  username: string
  realName: string
  phone: string
  department: string
  password: string
}

/** 用户登录，返回 token 与用户信息 */
export function login(_params: LoginParams): Promise<ApiResponse<{ token: string; userInfo: UserInfo }>> {
  // TODO: replace with → return request.post('/api/auth/login', params)
  return Promise.resolve(mockLoginRes)
}

/** 获取当前登录用户信息（页面刷新后凭 token 恢复 userInfo） */
export function getCurrentUser(): Promise<ApiResponse<UserInfo>> {
  // TODO: replace with → return request.get('/api/auth/me')
  return Promise.resolve(mockCurrentUserRes)
}

/** 检查用户名是否已被注册（注册表单异步校验用） */
export function checkUsernameAvailable(username: string): Promise<ApiResponse<{ available: boolean }>> {
  // TODO: replace with → return request.get('/api/auth/check-username', { params: { username } })
  const available = !MOCK_REGISTERED_USERNAMES.includes(username.toLowerCase())
  return Promise.resolve({ code: 200, message: 'ok', data: { available } })
}

/** 提交注册信息，成功后需跳转登录页 */
export function register(_params: RegisterParams): Promise<ApiResponse<null>> {
  // TODO: replace with → return request.post('/api/auth/register', params)
  return new Promise((resolve) =>
    setTimeout(() => resolve({ code: 200, message: '注册成功', data: null }), 800)
  )
}
