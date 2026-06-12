import type { UserStatus } from '@/types/user'
import dayjs from 'dayjs'

export const USER_STATUS_LABEL: Record<UserStatus, string> = {
  enabled: '启用',
  disabled: '禁用',
}

export const USER_STATUS_COLOR: Record<UserStatus, string> = {
  enabled: 'success',
  disabled: 'error',
}

/** 表单/弹窗内状态下拉 */
export const USER_STATUS_FORM_OPTIONS = [
  { label: '启用', value: 'enabled' as const },
  { label: '禁用', value: 'disabled' as const },
]

/** 用户列表表格横向滚动宽度 */
export const USER_TABLE_SCROLL_X = 1120

/**
 * 格式化用户创建时间为列表展示
 * @param value - ISO 8601 字符串
 */
export function formatUserDateTime(value: string): string {
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm:ss') : '—'
}

/**
 * 格式化最后登录时间；未登录显示「从未登录」
 * @param value - ISO 8601 或 null
 */
export function formatLastLoginAt(value: string | null): string {
  if (!value) {
    return '从未登录'
  }
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm:ss') : '—'
}
