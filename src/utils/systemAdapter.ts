import type { PageResult } from '@/types/common'
import type {
  CreateDepartmentParams,
  CreateRoleParams,
  Department,
  DepartmentMemberCheckResult,
  DepartmentQueryParams,
  DepartmentStatus,
  Role,
  RolePermissionKey,
  RolePermissionMap,
  RoleQueryParams,
  RoleStatus,
  UpdateDepartmentParams,
  UpdateRoleParams,
} from '@/types/system'
import { normalizeList, normalizePageResult } from '@/utils/pageResultAdapter'
import { ALL_PERMISSION_KEYS } from '@/utils/rolePermissions'

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

/** 规范布尔值（兼容 0/1、字符串 true/false） */
function normalizeBoolean(raw: unknown, fallback: boolean): boolean {
  if (raw === null || raw === undefined || raw === '') {
    return fallback
  }
  if (typeof raw === 'boolean') {
    return raw
  }
  const text = String(raw).toLowerCase()
  if (text === 'true' || text === '1') {
    return true
  }
  if (text === 'false' || text === '0') {
    return false
  }
  return fallback
}

/** 规范部门/角色启用状态 */
function normalizeEnabledStatus(raw: unknown): DepartmentStatus | RoleStatus {
  const text = String(raw ?? '').toLowerCase()
  if (text === 'disabled' || text === 'inactive' || text === '0' || text === 'false') {
    return 'disabled'
  }
  return 'enabled'
}

/** 解包分页 payload（兼容嵌套 data） */
function unwrapPageRaw(raw: unknown): unknown {
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
    return unwrapPageRaw(obj.data)
  }
  return obj
}

/**
 * 将后端 permissions 规范为 RolePermissionMap
 * @param raw - 对象键值或权限 key 数组
 */
export function normalizeRolePermissions(raw: unknown): RolePermissionMap {
  const permissions = Object.fromEntries(
    ALL_PERMISSION_KEYS.map((key) => [key, false]),
  ) as RolePermissionMap

  if (Array.isArray(raw)) {
    for (const item of raw) {
      const key = String(item ?? '').trim() as RolePermissionKey
      if (ALL_PERMISSION_KEYS.includes(key)) {
        permissions[key] = true
      }
    }
    return permissions
  }

  if (!raw || typeof raw !== 'object') {
    return permissions
  }

  const obj = raw as Record<string, unknown>
  for (const key of ALL_PERMISSION_KEYS) {
    if (key in obj) {
      permissions[key] = normalizeBoolean(obj[key], false)
    }
  }
  return permissions
}

/** 规范部门列表项 */
export function normalizeDepartment(raw: Record<string, unknown>): Department {
  return {
    departmentId: pickFirstNonEmptyString(raw.departmentId, raw.department_id, raw.id),
    departmentName: pickFirstNonEmptyString(
      raw.departmentName,
      raw.department_name,
      raw.name,
    ),
    status: normalizeEnabledStatus(raw.status),
    remark: String(raw.remark ?? raw.description ?? ''),
    createdAt: String(raw.createdAt ?? raw.created_at ?? raw.createTime ?? ''),
    memberCount: Number(raw.memberCount ?? raw.member_count ?? raw.userCount ?? 0),
  }
}

/** 规范部门分页结果 */
export function normalizeDepartmentPage(raw: unknown): PageResult<Department> {
  const page = normalizePageResult(unwrapPageRaw(raw), normalizeDepartment)
  if (page.list.length > 0 && page.total < page.list.length) {
    return { ...page, total: page.list.length }
  }
  return page
}

/** 规范删除前成员检查结果 */
export function normalizeDepartmentMemberCheck(raw: unknown): DepartmentMemberCheckResult {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const memberCount = Number(obj.memberCount ?? obj.member_count ?? obj.count ?? 0)
  const hasMembers = normalizeBoolean(
    obj.hasMembers ?? obj.has_members ?? (memberCount > 0 ? true : undefined),
    memberCount > 0,
  )
  return { hasMembers, memberCount }
}

/** 规范角色列表项 */
export function normalizeRole(raw: Record<string, unknown>): Role {
  return {
    roleId: pickFirstNonEmptyString(raw.roleId, raw.role_id, raw.id),
    roleName: pickFirstNonEmptyString(raw.roleName, raw.role_name, raw.name),
    roleCode: pickFirstNonEmptyString(raw.roleCode, raw.role_code, raw.code),
    status: normalizeEnabledStatus(raw.status),
    remark: String(raw.remark ?? raw.description ?? ''),
    isBuiltin: normalizeBoolean(
      raw.isBuiltin ?? raw.is_builtin ?? raw.builtin ?? raw.systemBuiltIn,
      false,
    ),
    permissions: normalizeRolePermissions(raw.permissions ?? raw.permissionList),
    createdAt: String(raw.createdAt ?? raw.created_at ?? raw.createTime ?? ''),
    boundUserCount: Number(
      raw.boundUserCount ?? raw.bound_user_count ?? raw.userCount ?? raw.memberCount ?? 0,
    ),
  }
}

/** 规范角色分页结果 */
export function normalizeRolePage(raw: unknown): PageResult<Role> {
  const page = normalizePageResult(unwrapPageRaw(raw), normalizeRole)
  if (page.list.length > 0 && page.total < page.list.length) {
    return { ...page, total: page.list.length }
  }
  return page
}

/**
 * 查询参数 → 后端 query（空值不下发）
 * @param params - 分页与筛选
 */
export function systemQueryParamsToApi(
  params: DepartmentQueryParams | RoleQueryParams,
): Record<string, unknown> {
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
 * 新增部门请求体 → 后端 body
 * @param data - 创建参数
 */
export function createDepartmentParamsToApi(
  data: CreateDepartmentParams,
): Record<string, unknown> {
  return {
    departmentName: data.departmentName.trim(),
    status: data.status,
    remark: data.remark.trim(),
  }
}

/**
 * 更新部门请求体 → 后端 body
 * @param data - 更新参数
 */
export function updateDepartmentParamsToApi(
  data: UpdateDepartmentParams,
): Record<string, unknown> {
  return createDepartmentParamsToApi(data)
}

/**
 * 新增/更新角色请求体 → 后端 body
 * @param data - 创建或更新参数
 */
export function roleParamsToApi(
  data: CreateRoleParams | UpdateRoleParams,
): Record<string, unknown> {
  return {
    roleName: data.roleName.trim(),
    roleCode: data.roleCode.trim(),
    status: data.status,
    remark: data.remark.trim(),
    permissions: data.permissions,
  }
}
