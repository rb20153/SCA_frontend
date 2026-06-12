import type { DepartmentListFilters, DepartmentQueryParams } from '@/types/system'

/** 部门状态筛选项（首项为全部） */
export const DEPARTMENT_STATUS_FILTER_OPTIONS = [
  { label: '全部状态', value: '' as const },
  { label: '启用', value: 'enabled' as const },
  { label: '禁用', value: 'disabled' as const },
]

/** 表单/弹窗内状态下拉 */
export const DEPARTMENT_STATUS_FORM_OPTIONS = [
  { label: '启用', value: 'enabled' as const },
  { label: '禁用', value: 'disabled' as const },
]

/** 创建空筛选表单 */
export function createEmptyDepartmentListFilters(): DepartmentListFilters {
  return {
    departmentName: '',
    status: '',
  }
}

/**
 * 将筛选表单转为 API 查询参数（空字符串字段不传递）
 * @param filters - 查询区表单值
 */
export function departmentListFiltersToQuery(
  filters: DepartmentListFilters,
): Omit<DepartmentQueryParams, 'page' | 'pageSize'> {
  const query: Omit<DepartmentQueryParams, 'page' | 'pageSize'> = {}

  const departmentName = filters.departmentName.trim()
  if (departmentName) {
    query.departmentName = departmentName
  }

  if (filters.status) {
    query.status = filters.status
  }

  return query
}
