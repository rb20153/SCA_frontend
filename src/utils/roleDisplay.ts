import type { RoleStatus } from '@/types/system'
import dayjs from 'dayjs'

export const ROLE_STATUS_LABEL: Record<RoleStatus, string> = {
  enabled: '启用',
  disabled: '禁用',
}

export const ROLE_STATUS_COLOR: Record<RoleStatus, string> = {
  enabled: 'success',
  disabled: 'error',
}

/** 角色列表表格横向滚动宽度 */
export const ROLE_TABLE_SCROLL_X = 1080

/**
 * 格式化角色创建时间为列表展示
 * @param value - ISO 8601 字符串
 */
export function formatRoleDateTime(value: string): string {
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm:ss') : '—'
}
