import type { ApiResponse, PageResult } from '@/types/common'
import type {
  CreateUserParams,
  DepartmentOption,
  ResetUserPasswordParams,
  ResetUserPasswordResult,
  RoleOption,
  SystemUser,
  UpdateUserParams,
  UserDetail,
  UserQueryParams,
} from '@/types/user'
import {
  MOCK_DEPARTMENT_MEMBER_COUNTS,
} from '@/mock/modules/system/departmentList'
import {
  MOCK_ROLE_USER_COUNTS,
} from '@/mock/modules/system/roleList'
import {
  MOCK_ALL_USERS,
  MOCK_USER_PASSWORDS,
  createMockUserId,
  filterMockUserList,
  getMockEnabledDepartmentOptions,
  getMockEnabledRoleOptions,
  getMockRoleFilterOptions,
  isMockUsernameTaken,
  registerMockUsername,
} from '@/mock/modules/system/userList'
import { MOCK_ALL_DEPARTMENTS } from '@/mock/modules/system/departmentList'
import { MOCK_ALL_ROLES } from '@/mock/modules/system/roleList'
import { appendPasswordResetSiteMessage } from '@/mock/modules/system/siteMessageList'
import {
  getMockOwnedProjectCount,
  getMockUserDetail,
} from '@/mock/modules/system/userProjects'
import { MOCK_REGISTERED_USERNAMES } from '@/mock/modules/auth/users'
import { isValidPhone, isValidUsername } from '@/utils/userValidation'

const DEFAULT_PAGE_SIZE = 10

/**
 * 获取用户列表（分页 + 筛选）
 * @param params - 姓名、角色、部门、创建时间、分页
 */
export function getUserList(
  params: UserQueryParams,
): Promise<ApiResponse<PageResult<SystemUser>>> {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE

  const sorted = filterMockUserList(params)
  const start = (page - 1) * pageSize
  const list = sorted.slice(start, start + pageSize)

  // TODO: replace with → return request.get('/api/system/users', { params })
  return Promise.resolve({
    code: 200,
    message: 'ok',
    data: {
      list,
      total: sorted.length,
      page,
      pageSize,
    },
  })
}

/**
 * 获取启用状态的部门下拉选项（新增/编辑用户弹窗打开时调用）
 */
export function getEnabledDepartmentOptions(): Promise<ApiResponse<DepartmentOption[]>> {
  // TODO: replace with → return request.get('/api/system/departments/options', { params: { status: 'enabled' } })
  return Promise.resolve({
    code: 200,
    message: 'ok',
    data: getMockEnabledDepartmentOptions(),
  })
}

/**
 * 获取启用状态的系统角色下拉选项（新增/编辑用户弹窗打开时调用）
 */
export function getEnabledRoleOptions(): Promise<ApiResponse<RoleOption[]>> {
  // TODO: replace with → return request.get('/api/system/roles/options', { params: { status: 'enabled' } })
  return Promise.resolve({
    code: 200,
    message: 'ok',
    data: getMockEnabledRoleOptions(),
  })
}

/**
 * 获取筛选区系统角色下拉（全部角色）
 */
export function getRoleFilterOptions(): Promise<ApiResponse<RoleOption[]>> {
  // TODO: replace with → return request.get('/api/system/roles/filter-options')
  return Promise.resolve({
    code: 200,
    message: 'ok',
    data: getMockRoleFilterOptions(),
  })
}

/** 根据部门 ID 解析名称 */
function resolveDepartmentName(departmentId: string): string {
  return MOCK_ALL_DEPARTMENTS.find((item) => item.departmentId === departmentId)?.departmentName ?? ''
}

/** 根据角色 ID 解析名称 */
function resolveRoleName(roleId: string): string {
  return MOCK_ALL_ROLES.find((item) => item.roleId === roleId)?.roleName ?? ''
}

/** mock：部门绑定人数 +1 */
function incrementDepartmentMemberCount(departmentId: string): void {
  MOCK_DEPARTMENT_MEMBER_COUNTS[departmentId] =
    (MOCK_DEPARTMENT_MEMBER_COUNTS[departmentId] ?? 0) + 1
}

/** mock：部门绑定人数 -1 */
function decrementDepartmentMemberCount(departmentId: string): void {
  const current = MOCK_DEPARTMENT_MEMBER_COUNTS[departmentId] ?? 0
  MOCK_DEPARTMENT_MEMBER_COUNTS[departmentId] = Math.max(0, current - 1)
}

/** mock：角色绑定用户数 +1 */
function incrementRoleUserCount(roleId: string): void {
  MOCK_ROLE_USER_COUNTS[roleId] = (MOCK_ROLE_USER_COUNTS[roleId] ?? 0) + 1
}

/** mock：角色绑定用户数 -1 */
function decrementRoleUserCount(roleId: string): void {
  const current = MOCK_ROLE_USER_COUNTS[roleId] ?? 0
  MOCK_ROLE_USER_COUNTS[roleId] = Math.max(0, current - 1)
}

/**
 * 新增用户
 * @param data - 用户名、姓名、密码、部门、角色、手机、状态
 */
export function createUser(data: CreateUserParams): Promise<ApiResponse<SystemUser>> {
  const username = data.username.trim()
  const realName = data.realName.trim()
  const phone = data.phone.trim()

  if (!username) {
    return Promise.reject(new Error('用户名不能为空'))
  }
  if (!isValidUsername(username)) {
    return Promise.reject(new Error('用户名为 4-20 位字母或数字'))
  }
  if (isMockUsernameTaken(username)) {
    return Promise.reject(new Error('用户名已存在'))
  }
  if (!realName) {
    return Promise.reject(new Error('姓名不能为空'))
  }
  if (!data.password) {
    return Promise.reject(new Error('初始密码不能为空'))
  }
  if (!data.departmentId) {
    return Promise.reject(new Error('请选择部门'))
  }
  if (!data.roleId) {
    return Promise.reject(new Error('请选择系统角色'))
  }
  if (!isValidPhone(phone)) {
    return Promise.reject(new Error('请输入正确的 11 位手机号'))
  }

  const departmentName = resolveDepartmentName(data.departmentId)
  const roleName = resolveRoleName(data.roleId)
  if (!departmentName) {
    return Promise.reject(new Error('部门不存在'))
  }
  if (!roleName) {
    return Promise.reject(new Error('系统角色不存在'))
  }

  const userId = createMockUserId()
  const record = {
    userId,
    username,
    realName,
    departmentId: data.departmentId,
    departmentName,
    roleId: data.roleId,
    roleName,
    phone,
    status: data.status,
    createdAt: new Date().toISOString(),
    lastLoginAt: null,
  }

  MOCK_ALL_USERS.unshift(record)
  MOCK_USER_PASSWORDS[userId] = data.password
  registerMockUsername(username)
  incrementDepartmentMemberCount(data.departmentId)
  incrementRoleUserCount(data.roleId)

  // TODO: replace with → return request.post('/api/system/users', data)
  const user: SystemUser = {
    ...record,
    ownedProjectCount: 0,
  }

  return Promise.resolve({ code: 200, message: 'ok', data: user })
}

/**
 * 获取用户详情（含已加入 / 负责项目）
 * @param userId - 用户 ID
 */
export function getUserDetail(userId: string): Promise<ApiResponse<UserDetail>> {
  const detail = getMockUserDetail(userId)
  if (!detail) {
    return Promise.reject(new Error('用户不存在'))
  }

  // TODO: replace with → return request.get(`/api/system/users/${userId}`)
  return Promise.resolve({ code: 200, message: 'ok', data: detail })
}

/**
 * 更新用户（用户名不可修改）
 * @param userId - 用户 ID
 * @param data - 可编辑字段
 */
export function updateUser(
  userId: string,
  data: UpdateUserParams,
): Promise<ApiResponse<SystemUser>> {
  const realName = data.realName.trim()
  const phone = data.phone.trim()

  if (!realName) {
    return Promise.reject(new Error('姓名不能为空'))
  }
  if (!data.departmentId) {
    return Promise.reject(new Error('请选择部门'))
  }
  if (!data.roleId) {
    return Promise.reject(new Error('请选择系统角色'))
  }
  if (!isValidPhone(phone)) {
    return Promise.reject(new Error('请输入正确的 11 位手机号'))
  }

  const index = MOCK_ALL_USERS.findIndex((item) => item.userId === userId)
  if (index < 0) {
    return Promise.reject(new Error('用户不存在'))
  }

  const current = MOCK_ALL_USERS[index]
  const departmentName = resolveDepartmentName(data.departmentId)
  const roleName = resolveRoleName(data.roleId)
  if (!departmentName) {
    return Promise.reject(new Error('部门不存在'))
  }
  if (!roleName) {
    return Promise.reject(new Error('系统角色不存在'))
  }

  if (current.departmentId !== data.departmentId) {
    decrementDepartmentMemberCount(current.departmentId)
    incrementDepartmentMemberCount(data.departmentId)
  }
  if (current.roleId !== data.roleId) {
    decrementRoleUserCount(current.roleId)
    incrementRoleUserCount(data.roleId)
  }

  const updated = {
    ...current,
    realName,
    departmentId: data.departmentId,
    departmentName,
    roleId: data.roleId,
    roleName,
    phone,
    status: data.status,
  }
  MOCK_ALL_USERS[index] = updated

  // TODO: replace with → return request.put(`/api/system/users/${userId}`, data)
  return Promise.resolve({
    code: 200,
    message: 'ok',
    data: {
      ...updated,
      ownedProjectCount: getMockOwnedProjectCount(userId),
    },
  })
}

/**
 * 删除用户（调用方应先确认 ownedProjectCount 为 0）
 * @param userId - 用户 ID
 */
export function deleteUser(userId: string): Promise<ApiResponse<null>> {
  const index = MOCK_ALL_USERS.findIndex((item) => item.userId === userId)
  if (index < 0) {
    return Promise.reject(new Error('用户不存在'))
  }

  const current = MOCK_ALL_USERS[index]
  if (getMockOwnedProjectCount(userId) > 0) {
    return Promise.reject(new Error('该用户仍负责项目，请先移交'))
  }

  MOCK_ALL_USERS.splice(index, 1)
  delete MOCK_USER_PASSWORDS[userId]

  const usernameIndex = MOCK_REGISTERED_USERNAMES.findIndex(
    (item) => item.toLowerCase() === current.username.toLowerCase(),
  )
  if (usernameIndex >= 0) {
    MOCK_REGISTERED_USERNAMES.splice(usernameIndex, 1)
  }

  decrementDepartmentMemberCount(current.departmentId)
  decrementRoleUserCount(current.roleId)

  // TODO: replace with → return request.delete(`/api/system/users/${userId}`)
  return Promise.resolve({ code: 200, message: 'ok', data: null })
}

/**
 * 重置用户密码并发送站内系统公告
 * @param data - 用户 ID、用户名、新密码
 */
export function resetUserPassword(
  data: ResetUserPasswordParams,
): Promise<ApiResponse<ResetUserPasswordResult>> {
  if (!MOCK_USER_PASSWORDS[data.userId]) {
    return Promise.reject(new Error('用户不存在'))
  }

  MOCK_USER_PASSWORDS[data.userId] = data.newPassword
  appendPasswordResetSiteMessage(data.userId, data.username, data.newPassword)

  // TODO: replace with → return request.post(`/api/system/users/${data.userId}/reset-password`, { password: data.newPassword })
  return Promise.resolve({
    code: 200,
    message: 'ok',
    data: {
      userId: data.userId,
      username: data.username,
    },
  })
}
