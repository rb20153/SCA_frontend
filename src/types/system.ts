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

/** 审计日志结果 */
export type LogResult = 'success' | 'failure'

/** 日志导出格式 */
export type LogExportFormat = 'csv' | 'json'

export interface LogListItem {
  logId: string
  traceId: string
  /** 发生时间，ISO 8601 */
  occurredAt: string
  username: string
  module: string
  operation: string
  resourceObject: string
  ip: string
  result: LogResult
  /** 关联检测任务 ID，供从任务页跳转筛选 */
  relatedTaskId?: string
}

export interface LogTimelineItem {
  /** 展示用时刻，如 10:00:12 */
  time: string
  message: string
}

/** 全链路日志详情（抽屉） */
export interface LogDetail {
  logId: string
  traceId: string
  username: string
  sourceIp: string
  result: LogResult
  auditConclusion: string
  timeline: LogTimelineItem[]
  /** 原始日志节选 */
  rawLogExcerpt: string
}

export interface LogListFilters {
  traceId: string
  /** 时间范围（日期+时刻） */
  occurredAtRange: [Dayjs, Dayjs] | null
  username: string
  /** 资源/对象（如检测任务名称） */
  resourceObject: string
  result: LogResult | ''
}

export interface LogQueryParams extends PageParams {
  traceId?: string
  username?: string
  result?: LogResult
  occurredAtStart?: string
  occurredAtEnd?: string
  /** 资源/对象关键词（模糊匹配，如任务名称） */
  resourceObject?: string
  /** @deprecated 从任务页跳转请使用 resourceObject（任务名） */
  taskId?: string
}

export interface LogExportParams {
  startTime: string
  endTime: string
  format: LogExportFormat
}

export interface LogExportResult {
  downloadUrl: string
  fileName: string
}

/** 部门启用状态 */
export type DepartmentStatus = 'enabled' | 'disabled'

/** 部门持久化字段（mock / 后端存储，不含成员数） */
export interface DepartmentRecord {
  departmentId: string
  departmentName: string
  status: DepartmentStatus
  remark: string
  /** 创建时间，ISO 8601 */
  createdAt: string
}

/** 部门列表项（含成员人数） */
export interface Department extends DepartmentRecord {
  /** 当前绑定成员数 */
  memberCount: number
}

export interface DepartmentListFilters {
  departmentName: string
  status: DepartmentStatus | ''
}

export interface DepartmentQueryParams extends PageParams {
  departmentName?: string
  status?: DepartmentStatus
}

export interface CreateDepartmentParams {
  departmentName: string
  status: DepartmentStatus
  remark: string
}

export type UpdateDepartmentParams = CreateDepartmentParams

export interface DepartmentFormValues {
  departmentName: string
  status: DepartmentStatus
  remark: string
}

/** 删除部门前成员绑定检查 */
export interface DepartmentMemberCheckResult {
  hasMembers: boolean
  memberCount: number
}
