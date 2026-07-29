import type {
  CreateUserParams,
  ResetUserPasswordParams,
  ResetUserPasswordResult,
  RoleOption,
  SystemUser,
  UpdateUserParams,
  UserDetail,
  UserProjectRef,
  UserQueryParams,
  UserSearchCandidate,
  UserStatus,
  DepartmentOption,
} from '@/types/user'
import type { PageResult } from '@/types/common'
import { normalizeList, normalizePageResult } from '@/utils/pageResultAdapter'

/** 取第一个非空字符串 */
function pickFirstNonEmptyString(...candidates: unknown[]): string {
  for (const candidate of candidates) {
    const text = String(candidate ?? '').trim()
    if (text) {
      return text
    }
  }
  return ''
}

/** 规范用户账号状态 */
function normalizeUserStatus(raw: unknown): UserStatus {
  const text = String(raw ?? '').toLowerCase()
  if (text === 'disabled' || text === 'inactive' || text === '0' || text === 'false') {
    return 'disabled'
  }
  return 'enabled'
}

/** 解包用户列表分页 payload */
function unwrapSystemUserPageRaw(raw: unknown): unknown {
  if (Array.isArray(raw)) {
    return raw
  }
  if (!raw || typeof raw !== 'object') {
    return raw
  }
  const obj = raw as Record<string, unknown>
  if (obj.list ?? obj.items ?? obj.records) {
    return obj
  }
  if (obj.data !== undefined) {
    return unwrapSystemUserPageRaw(obj.data)
  }
  return obj
}

/** 将后端用户搜索项规范为 UserSearchCandidate */
export function normalizeUserSearchCandidate(raw: Record<string, unknown>): UserSearchCandidate {
  return {
    userId: String(raw.userId ?? raw.id ?? ''),
    realName: String(raw.realName ?? raw.displayName ?? raw.name ?? ''),
    username: String(raw.username ?? ''),
    departmentName: String(raw.departmentName ?? raw.department ?? ''),
    roleName: String(raw.roleName ?? raw.role ?? ''),
  }
}

/** 规范用户搜索列表 */
export function normalizeUserSearchList(raw: unknown): UserSearchCandidate[] {
  return normalizeList(raw, normalizeUserSearchCandidate)
}

/** 将后端部门选项规范为 DepartmentOption */
export function normalizeDepartmentOption(raw: Record<string, unknown>): DepartmentOption {
  return {
    departmentId: String(raw.departmentId ?? raw.id ?? ''),
    departmentName: String(raw.departmentName ?? raw.name ?? raw.label ?? ''),
  }
}

/** 规范部门下拉列表 */
export function normalizeDepartmentOptionList(raw: unknown): DepartmentOption[] {
  return normalizeList(raw, normalizeDepartmentOption).filter((item) => item.departmentId)
}

/** 规范角色下拉项 */
export function normalizeRoleOption(raw: Record<string, unknown>): RoleOption {
  return {
    roleId: String(raw.roleId ?? raw.id ?? ''),
    roleName: String(raw.roleName ?? raw.name ?? raw.label ?? ''),
  }
}

/** 规范角色下拉列表 */
export function normalizeRoleOptionList(raw: unknown): RoleOption[] {
  return normalizeList(raw, normalizeRoleOption).filter((item) => item.roleId)
}

/** 规范用户关联项目摘要 */
function normalizeUserProjectRef(raw: Record<string, unknown>): UserProjectRef {
  return {
    projectId: String(raw.projectId ?? raw.id ?? ''),
    projectName: pickFirstNonEmptyString(raw.projectName, raw.name, raw.project_name),
  }
}

/** 规范系统用户列表项 / 详情基础字段 */
export function normalizeSystemUser(raw: Record<string, unknown>): SystemUser {
  const lastLoginRaw = raw.lastLoginAt ?? raw.last_login_at ?? raw.lastLoginTime

  return {
    userId: pickFirstNonEmptyString(raw.userId, raw.user_id, raw.id),
    username: String(raw.username ?? ''),
    realName: pickFirstNonEmptyString(raw.realName, raw.real_name, raw.displayName, raw.name),
    departmentId: pickFirstNonEmptyString(raw.departmentId, raw.department_id, raw.deptId),
    departmentName: pickFirstNonEmptyString(
      raw.departmentName,
      raw.department_name,
      raw.department,
    ),
    roleId: pickFirstNonEmptyString(raw.roleId, raw.role_id),
    roleName: pickFirstNonEmptyString(raw.roleName, raw.role_name, raw.role),
    phone: String(raw.phone ?? raw.mobile ?? ''),
    status: normalizeUserStatus(raw.status),
    createdAt: String(raw.createdAt ?? raw.created_at ?? raw.createTime ?? ''),
    lastLoginAt:
      lastLoginRaw === null || lastLoginRaw === undefined || lastLoginRaw === ''
        ? null
        : String(lastLoginRaw),
    ownedProjectCount: Number(
      raw.ownedProjectCount ?? raw.owned_project_count ?? raw.responsibleProjectCount ?? 0,
    ),
  }
}

/** 规范用户列表分页结果 */
export function normalizeSystemUserPage(raw: unknown): PageResult<SystemUser> {
  const page = normalizePageResult(unwrapSystemUserPageRaw(raw), normalizeSystemUser)
  if (page.list.length > 0 && page.total < page.list.length) {
    return { ...page, total: page.list.length }
  }
  return page
}

/**
 * 规范用户详情（含已加入 / 负责项目）
 * @param raw - 后端详情对象
 * @param userId - 路由/列表携带的用户 ID（兜底）
 */
export function normalizeUserDetail(raw: unknown, userId: string): UserDetail {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const base = normalizeSystemUser(obj)

  const joinedRaw = obj.joinedProjects ?? obj.joined_projects ?? obj.memberProjects
  const ownedRaw = obj.ownedProjects ?? obj.owned_projects ?? obj.responsibleProjects

  const joinedProjects = Array.isArray(joinedRaw)
    ? joinedRaw.map((item) => normalizeUserProjectRef(item as Record<string, unknown>))
    : []
  const ownedProjects = Array.isArray(ownedRaw)
    ? ownedRaw.map((item) => normalizeUserProjectRef(item as Record<string, unknown>))
    : []

  return {
    ...base,
    userId: base.userId || userId,
    joinedProjects,
    ownedProjects,
  }
}

/** 规范重置密码结果 */
export function normalizeResetUserPasswordResult(
  raw: Record<string, unknown>,
  fallback: ResetUserPasswordParams,
): ResetUserPasswordResult {
  return {
    userId: pickFirstNonEmptyString(raw.userId, raw.user_id, raw.id, fallback.userId),
    username: pickFirstNonEmptyString(raw.username, fallback.username),
  }
}

/**
 * 用户列表查询参数 → 后端 query（空值不下发）
 * @param params - 分页与筛选
 */
export function userQueryParamsToApi(params: UserQueryParams): Record<string, unknown> {
  const query: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') {
      continue
    }
    query[key] = value
  }
  return query
}

/**
 * 新增用户请求体 → 后端 body
 * @param data - 创建参数
 */
export function createUserParamsToApi(data: CreateUserParams): Record<string, unknown> {
  return {
    username: data.username.trim(),
    realName: data.realName.trim(),
    password: data.password,
    departmentId: data.departmentId,
    roleId: data.roleId,
    phone: data.phone.trim(),
    status: data.status,
  }
}

/**
 * 更新用户请求体 → 后端 body
 * @param data - 更新参数
 */
export function updateUserParamsToApi(data: UpdateUserParams): Record<string, unknown> {
  return {
    realName: data.realName.trim(),
    departmentId: data.departmentId,
    roleId: data.roleId,
    phone: data.phone.trim(),
    status: data.status,
  }
}

/**
 * 重置密码请求体 → 后端 body（userId 走 Path）
 * @param data - 重置密码参数
 */
export function resetUserPasswordParamsToApi(
  data: ResetUserPasswordParams,
): Record<string, unknown> {
  return {
    newPassword: data.newPassword,
  }
}
