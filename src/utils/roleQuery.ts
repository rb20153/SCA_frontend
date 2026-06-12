import type { RoleListFilters, RoleQueryParams } from '@/types/system'

/** 角色状态筛选项（首项为全部） */
export const ROLE_STATUS_FILTER_OPTIONS = [
  { label: '全部状态', value: '' as const },
  { label: '启用', value: 'enabled' as const },
  { label: '禁用', value: 'disabled' as const },
]

/** 表单/抽屉内状态下拉 */
export const ROLE_STATUS_FORM_OPTIONS = [
  { label: '启用', value: 'enabled' as const },
  { label: '禁用', value: 'disabled' as const },
]

/** 创建空筛选表单 */
export function createEmptyRoleListFilters(): RoleListFilters {
  return {
    roleName: '',
    status: '',
  }
}

/**
 * 将筛选表单转为 API 查询参数（空字符串字段不传递）
 * @param filters - 查询区表单值
 */
export function roleListFiltersToQuery(
  filters: RoleListFilters,
): Omit<RoleQueryParams, 'page' | 'pageSize'> {
  const query: Omit<RoleQueryParams, 'page' | 'pageSize'> = {}

  const roleName = filters.roleName.trim()
  if (roleName) {
    query.roleName = roleName
  }

  if (filters.status) {
    query.status = filters.status
  }

  return query
}
