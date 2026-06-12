import type { UserListFilters, UserQueryParams } from '@/types/user'

/** 创建空用户列表筛选表单 */
export function createEmptyUserListFilters(): UserListFilters {
  return {
    realName: '',
    roleId: '',
    departmentName: '',
    createdAtRange: null,
  }
}

/**
 * 将筛选表单转为 API 查询参数（空值字段不传递）
 * @param filters - 查询区表单值
 */
export function userListFiltersToQuery(
  filters: UserListFilters,
): Omit<UserQueryParams, 'page' | 'pageSize'> {
  const query: Omit<UserQueryParams, 'page' | 'pageSize'> = {}

  const realName = filters.realName.trim()
  if (realName) {
    query.realName = realName
  }

  if (filters.roleId) {
    query.roleId = filters.roleId
  }

  const departmentName = filters.departmentName.trim()
  if (departmentName) {
    query.departmentName = departmentName
  }

  if (filters.createdAtRange) {
    query.createdAtStart = filters.createdAtRange[0].format('YYYY-MM-DD HH:mm:ss')
    query.createdAtEnd = filters.createdAtRange[1].format('YYYY-MM-DD HH:mm:ss')
  }

  return query
}
