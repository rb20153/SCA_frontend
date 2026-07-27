import request from '@/utils/request'
import type { ApiResponse } from '@/types/common'
import type { UserInfo } from '@/stores/auth'
import { normalizeMeUser, type MeUserRaw } from '@/utils/authUser'

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
export function login(params: LoginParams): Promise<ApiResponse<{ token: string; userInfo: UserInfo }>> {
  return request.post('/api/auth/login', params)
}

/**
 * 获取当前登录用户信息（页面刷新后凭 token 恢复 userInfo）
 * /me 可能混入 JWT 字段且 realName 与 login.userInfo 不一致，此处规范化为 UserInfo
 */
export async function getCurrentUser(): Promise<ApiResponse<UserInfo>> {
  const res = await request.get<ApiResponse<MeUserRaw>>('/api/auth/me')
  return { ...res, data: normalizeMeUser(res.data) }
}

/** 检查用户名是否已被注册（注册表单异步校验用） */
export function checkUsernameAvailable(username: string): Promise<ApiResponse<{ available: boolean }>> {
  return request.get('/api/auth/check-username', { params: { username } })
}

/** 提交注册信息，成功后需跳转登录页 */
export function register(params: RegisterParams): Promise<ApiResponse<null>> {
  return request.post('/api/auth/register', params)
}
