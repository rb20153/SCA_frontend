import type { ApiResponse, PageResult } from '@/types/common'
import request from '@/utils/request'
import type {
  CreateUserParams,
  ResetUserPasswordParams,
  ResetUserPasswordResult,
  RoleOption,
  SystemUser,
  UpdateUserParams,
  UserDetail,
  UserQueryParams,
  UserSearchCandidate,
  DepartmentOption,
} from '@/types/user'
import {
  createUserParamsToApi,
  normalizeRoleOptionList,
  normalizeSystemUser,
  normalizeSystemUserPage,
  normalizeUserDetail,
  normalizeUserSearchList,
  normalizeDepartmentOptionList,
  resetUserPasswordParamsToApi,
  normalizeResetUserPasswordResult,
  updateUserParamsToApi,
  userQueryParamsToApi,
} from '@/utils/userAdapter'

/**
 * 获取用户列表（分页 + 筛选）
 * @param params - 姓名、角色、部门、创建时间、分页
 */
export async function getUserList(
  params: UserQueryParams,
): Promise<ApiResponse<PageResult<SystemUser>>> {
  const res = await request.get<ApiResponse<unknown>>('/api/system/users', {
    params: userQueryParamsToApi(params),
  })
  const pageRaw = res.data ?? res
  return { ...res, data: normalizeSystemUserPage(pageRaw) }
}

/**
 * 获取启用状态的部门下拉选项（新增/编辑项目、用户管理、登录页注册）
 * @param silent - true 时失败不弹全局提示，交由调用方降级（注册页未登录场景用）
 */
export async function getEnabledDepartmentOptions(
  silent = false,
): Promise<ApiResponse<DepartmentOption[]>> {
  const res = await request.get<ApiResponse<unknown>>('/api/system/departments/options', {
    params: { status: 'enabled' },
    silent,
  })
  return { ...res, data: normalizeDepartmentOptionList(res.data) }
}

/**
 * 搜索启用用户（姓名/用户名，不限项目）
 * @param keyword - 搜索关键词
 */
export async function searchUsers(keyword: string): Promise<ApiResponse<UserSearchCandidate[]>> {
  const res = await request.get<ApiResponse<unknown>>('/api/system/users/search', {
    params: { keyword },
  })
  return { ...res, data: normalizeUserSearchList(res.data) }
}

/**
 * 获取启用状态的系统角色下拉选项（新增/编辑用户弹窗打开时调用）
 */
export async function getEnabledRoleOptions(): Promise<ApiResponse<RoleOption[]>> {
  const res = await request.get<ApiResponse<unknown>>('/api/system/roles/options', {
    params: { status: 'enabled' },
  })
  const listRaw = res.data ?? res
  return { ...res, data: normalizeRoleOptionList(listRaw) }
}

/**
 * 获取筛选区系统角色下拉（全部角色）
 */
export async function getRoleFilterOptions(): Promise<ApiResponse<RoleOption[]>> {
  const res = await request.get<ApiResponse<unknown>>('/api/system/roles/filter-options')
  const listRaw = res.data ?? res
  return { ...res, data: normalizeRoleOptionList(listRaw) }
}

/**
 * 新增用户
 * @param data - 用户名、姓名、密码、部门、角色、手机、状态
 */
export async function createUser(data: CreateUserParams): Promise<ApiResponse<SystemUser>> {
  const res = await request.post<ApiResponse<unknown>>(
    '/api/system/users',
    createUserParamsToApi(data),
  )
  const userRaw =
    res.data && typeof res.data === 'object' ? (res.data as Record<string, unknown>) : {}
  return { ...res, data: normalizeSystemUser(userRaw) }
}

/**
 * 获取用户详情（含已加入 / 负责项目）
 * @param userId - 用户 ID
 */
export async function getUserDetail(userId: string): Promise<ApiResponse<UserDetail>> {
  const res = await request.get<ApiResponse<unknown>>(`/api/system/users/${userId}`)
  return { ...res, data: normalizeUserDetail(res.data, userId) }
}

/**
 * 更新用户（用户名不可修改）
 * @param userId - 用户 ID
 * @param data - 可编辑字段
 */
export async function updateUser(
  userId: string,
  data: UpdateUserParams,
): Promise<ApiResponse<SystemUser>> {
  const res = await request.put<ApiResponse<unknown>>(
    `/api/system/users/${userId}`,
    updateUserParamsToApi(data),
  )
  const userRaw =
    res.data && typeof res.data === 'object' ? (res.data as Record<string, unknown>) : {}
  return { ...res, data: normalizeSystemUser(userRaw) }
}

/**
 * 删除用户（调用方应先确认 ownedProjectCount 为 0）
 * @param userId - 用户 ID
 */
export async function deleteUser(userId: string): Promise<ApiResponse<null>> {
  return request.delete<ApiResponse<null>>(`/api/system/users/${userId}`)
}

/**
 * 重置用户密码并发送站内系统公告
 * @param data - 用户 ID、用户名、新密码
 */
export async function resetUserPassword(
  data: ResetUserPasswordParams,
): Promise<ApiResponse<ResetUserPasswordResult>> {
  const res = await request.post<ApiResponse<unknown>>(
    `/api/system/users/${data.userId}/reset-password`,
    resetUserPasswordParamsToApi(data),
  )
  const resultRaw =
    res.data && typeof res.data === 'object' ? (res.data as Record<string, unknown>) : {}
  return {
    ...res,
    data: normalizeResetUserPasswordResult(resultRaw, data),
  }
}
