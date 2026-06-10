import type { LogResult } from '@/types/system'

/** 日志列表横向滚动宽度 */
export const LOG_TABLE_SCROLL_X = 1180

export const LOG_RESULT_LABEL: Record<LogResult, string> = {
  success: '成功',
  failure: '失败',
}

export const LOG_RESULT_COLOR: Record<LogResult, string> = {
  success: 'success',
  failure: 'error',
}

/**
 * 格式化日志列表/详情中的时间展示
 * @param iso - ISO 8601 时间字符串
 */
export function formatLogDateTime(iso: string): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso

  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}
