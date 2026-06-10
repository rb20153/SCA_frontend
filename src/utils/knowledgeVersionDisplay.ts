import type { KbVersionStatus } from '@/types/knowledge'
import dayjs from 'dayjs'

export const KB_VERSION_STATUS_LABEL: Record<KbVersionStatus, string> = {
  ready: '已就绪',
  indexing: '索引构建中',
  archived: '已归档',
}

export const KB_VERSION_STATUS_COLOR: Record<KbVersionStatus, string> = {
  ready: 'success',
  indexing: 'processing',
  archived: 'default',
}

/** 版本列表表格横向滚动宽度 */
export const KB_VERSION_TABLE_SCROLL_X = 1100

/**
 * 格式化版本创建时间为列表展示
 * @param value - ISO 8601 字符串
 */
export function formatKbVersionDateTime(value: string): string {
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm') : '—'
}

/**
 * 格式化最近获取日期（仅日期）
 * @param value - ISO 8601 字符串
 */
export function formatKbVersionDate(value: string): string {
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : '—'
}
