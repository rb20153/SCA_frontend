import dayjs from 'dayjs'

/** 策略列表表格横向滚动宽度 */
export const POLICY_TABLE_SCROLL_X = 1050

/**
 * 格式化策略更新时间为列表展示
 * @param value - ISO 8601 字符串
 */
export function formatPolicyDateTime(value: string): string {
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm') : '—'
}
