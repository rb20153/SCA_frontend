import type { PageParams, TaskType } from '@/types/common'
import type { Dayjs } from 'dayjs'

/** 告警级别 */
export type AlertLevel = 'critical' | 'important' | 'normal'

/** 告警队列 Tab：未处理 / 已处理 */
export type AlertQueueStatus = 'pending' | 'handled'

/** 告警中心页顶部概览 */
export interface AlertCenterOverview {
  criticalCount: number
  importantCount: number
  normalCount: number
}

export interface AlertOverviewQueryParams {
  status: AlertQueueStatus
}

export interface AlertListItem {
  alertId: string
  level: AlertLevel
  title: string
  sourceModule: string
  /** 触发时间，ISO 8601 */
  occurredAt: string
  /** 未处理列表展示用 */
  status: 'pending' | 'handled'
  /** 已处理：处理时间 */
  handledAt?: string
  /** 已处理：处理人 */
  handlerName?: string
}

export interface AlertRelatedTask {
  taskId: string
  taskName: string
  taskType: TaskType
}

export interface AlertRelatedProject {
  projectId: string
  projectName: string
}

/** 告警详情（抽屉） */
export interface AlertDetail {
  alertId: string
  level: AlertLevel
  title: string
  triggerRule: string
  occurredAt: string
  content: string
  relatedTask?: AlertRelatedTask
  relatedProject?: AlertRelatedProject
  suggestions: string[]
}

export interface AlertListFilters {
  level: AlertLevel | ''
  /** 筛选时间（日期+时刻），默认今日 */
  occurredAt?: Dayjs
}

export interface AlertQueryParams extends PageParams {
  status: AlertQueueStatus
  level?: AlertLevel
  /** 筛选日期，格式 YYYY-MM-DD */
  occurredDate?: string
}
