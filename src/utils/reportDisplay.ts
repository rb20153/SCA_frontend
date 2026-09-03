import type { ReportStatus } from '@/types/report'
import dayjs from 'dayjs'

export const REPORT_STATUS_LABEL: Record<ReportStatus, string> = {
  completed: '已完成',
  generating: '生成中',
  failed: '失败',
}

export const REPORT_STATUS_COLOR: Record<ReportStatus, string> = {
  completed: 'success',
  generating: 'processing',
  failed: 'error',
}

/** 报告列表表格横向滚动宽度 */
export const REPORT_TABLE_SCROLL_X = 1210

/**
 * 格式化报告生成时间为列表展示（YYYY-MM-DD）
 * @param value - ISO 8601 字符串
 */
export function formatReportDate(value: string): string {
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : '—'
}

/**
 * 格式化报告生成时间为详情展示（日期 + 时间）
 * @param value - ISO 8601 字符串
 */
export function formatReportDateTime(value: string): string {
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm') : '—'
}
