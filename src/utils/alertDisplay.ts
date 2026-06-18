import type { AlertLevel } from '@/types/system'
import type { PageNavTabItem, TaskType } from '@/types/common'
import dayjs from 'dayjs'

/** 告警中心顶部 Tab：未处理 / 已处理 */
export const ALERT_QUEUE_TABS: PageNavTabItem[] = [
  { key: 'pending', label: '未处理' },
  { key: 'handled', label: '已处理' },
]

export const ALERT_LEVEL_LABEL: Record<AlertLevel, string> = {
  critical: '紧急',
  important: '重要',
  normal: '一般',
}

export const ALERT_LEVEL_COLOR: Record<AlertLevel, string> = {
  critical: 'error',
  important: 'warning',
  normal: 'default',
}

/** 告警列表表格横向滚动宽度 */
export const ALERT_TABLE_SCROLL_X = 1100

/**
 * 格式化告警时间为列表展示
 * @param value - ISO 8601 字符串
 */
export function formatAlertDateTime(value: string): string {
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm') : '—'
}

/**
 * 根据关联任务类型返回检测结果页路由
 * @param taskId - 任务 ID
 * @param taskType - 检测类型
 */
export function getAlertRelatedTaskRoute(taskId: string, taskType: TaskType) {
  if (taskType === 'autonomy') {
    return { name: 'AutonomyDetectResult', params: { taskId } }
  }
  return { name: 'OpenSourceRiskDetail', params: { taskId } }
}
