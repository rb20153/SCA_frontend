import type { ProjectStatus } from '@/types/project'
import dayjs from 'dayjs'

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  in_progress: '进行中',
  completed: '已完成',
  failed: '失败',
}

export const PROJECT_STATUS_COLOR: Record<ProjectStatus, string> = {
  in_progress: 'processing',
  completed: 'success',
  failed: 'error',
}

/** 项目列表表格横向滚动宽度 */
export const PROJECT_TABLE_SCROLL_X = 1100

/**
 * 格式化日期时间为列表展示（YYYY-MM-DD HH:mm）
 * @param value - ISO 8601 字符串；空值返回「—」
 */
export function formatProjectDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm') : '—'
}
