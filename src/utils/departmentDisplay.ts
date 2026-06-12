import type { DepartmentStatus } from '@/types/system'
import dayjs from 'dayjs'

export const DEPARTMENT_STATUS_LABEL: Record<DepartmentStatus, string> = {
  enabled: '启用',
  disabled: '禁用',
}

export const DEPARTMENT_STATUS_COLOR: Record<DepartmentStatus, string> = {
  enabled: 'success',
  disabled: 'error',
}

/** 部门列表表格横向滚动宽度 */
export const DEPARTMENT_TABLE_SCROLL_X = 976

/**
 * 格式化部门创建时间为列表展示
 * @param value - ISO 8601 字符串
 */
export function formatDepartmentDateTime(value: string): string {
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm:ss') : '—'
}
