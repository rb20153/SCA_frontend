import type { PageParams, TaskType } from '@/types/common'
import type { Dayjs } from 'dayjs'

/** 告警级别 */
export type AlertLevel = 'critical' | 'important' | 'normal'

/** 告警队列 Tab：未处理 / 已处理 */
export type AlertQueueStatus = 'pending' | 'handled'

/** 告警处置方式（与原型 alert-disposition 一致） */
export const ALERT_DISPOSITION = {
  AutoRecover: 'auto-recover',
  ManualFix: 'manual-fix',
  TransferReview: 'transfer-review',
  TempMitigate: 'temp-mitigate',
  AcceptRisk: 'accept-risk',
  FalsePositive: 'false-positive',
  IgnoreOnce: 'ignore-once',
} as const

export type AlertDisposition = (typeof ALERT_DISPOSITION)[keyof typeof ALERT_DISPOSITION]

/** 未处理列表已读筛选 */
export type AlertReadFilter = 'all' | 'unread' | 'read'

/** 告警可关联两类检测任务或 AI 辅助解析任务。 */
export type AlertTaskType = TaskType | 'ai-parse'

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
  /** 未处理：是否已读（蓝底高亮仅视觉区分，状态列仍显示未处理） */
  isRead?: boolean
  /** 已处理：处理时间 */
  handledAt?: string
  /** 已处理：处理人 */
  handlerName?: string
  /** 已处理：处置方式 */
  disposition?: AlertDisposition
}

export interface AlertRelatedTask {
  taskId: string
  taskName: string
  taskType: AlertTaskType
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
  occurredAt: string
  status: 'pending' | 'handled'
  /** 处置建议（后端 suggestion 字符串或 suggestions 数组） */
  suggestions: string[]
  /** 触发规则（后端无值时不展示） */
  triggerRule?: string
  /** 告警正文（后端无值时不展示） */
  content?: string
  /** 来源模块，如检测引擎 */
  sourceModule?: string
  /** 证据说明 */
  evidence?: string
  /** 全链路 TraceID */
  traceId?: string
  /** 处理记录 / 处置备注 */
  handleNote?: string
  /** 关联任务（后端 relatedTask，可能为空对象） */
  relatedTask: AlertRelatedTask
  /** 关联项目（后端 relatedProject，可能为空对象） */
  relatedProject: AlertRelatedProject
  handledAt?: string
  handlerName?: string
}

/** 提交告警处置请求体 */
export interface HandleAlertParams {
  disposition: AlertDisposition
  /** 处理说明 / 接受原因 / 误报说明 */
  remark?: string
  /** 转派复核：被指派人 */
  assigneeUserId?: string
  /** 转派复核：计划完成时间 ISO 8601 */
  plannedCompleteAt?: string
  notifyAuditor?: boolean
  notifyTaskOwner?: boolean
  notifyOps?: boolean
}

/** 处置接口返回：是否转入已处理队列 */
export interface HandleAlertResult {
  alert: AlertListItem
  movedToHandled: boolean
}

/** 处理时间线（已处理 Tab 弹窗，打开时从接口拉取） */
export interface AlertTimeline {
  alertId: string
  title: string
  handlerName: string
  timeline: LogTimelineItem[]
}

export interface AlertListFilters {
  level: AlertLevel | ''
  /** 未处理 Tab：已读状态筛选 */
  readStatus: AlertReadFilter
  /** 可选的告警发生日期筛选。 */
  occurredAt?: Dayjs
}

export interface AlertQueryParams extends PageParams {
  alertId?: string
  status: AlertQueueStatus
  level?: AlertLevel
  readStatus?: AlertReadFilter
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
  occurredAtRange: [Dayjs, Dayjs] | undefined
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

/** 部门持久化字段（不含实时聚合的成员数） */
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

/** 角色启用状态 */
export type RoleStatus = 'enabled' | 'disabled'

/** 后端可配置的页面权限键；基础页由前端强制放行，不在角色授权表中配置。 */
export type RolePermissionKey =
  | '/projects'
  | '/detect/autonomy'
  | '/detect/risk'
  | '/detect/ai-analysis'
  | '/policies'
  | '/reports'
  | '/reports/templates'
  | '/knowledge'
  | '/knowledge/coverage'
  | '/knowledge/vulnerabilities'
  | '/knowledge/quarter-updates'
  | '/system/users'
  | '/system/departments'
  | '/system/roles'
  | '/system/logs'
  | '/system/alerts'

export interface RolePagePermission {
  read: boolean
  write: boolean
}

export type RolePermissionMap = Record<RolePermissionKey, RolePagePermission>

/** 角色持久化字段（不含绑定用户数） */
export interface RoleRecord {
  roleId: string
  roleName: string
  roleCode: string
  status: RoleStatus
  remark: string
  /** 是否内置角色（内置不可删除） */
  isBuiltin: boolean
  permission: RolePermissionMap
  /** 创建时间，ISO 8601 */
  createdAt: string
}

/** 角色列表项（含绑定用户数） */
export interface Role extends RoleRecord {
  boundUserCount: number
}

export interface RoleListFilters {
  roleName: string
  status: RoleStatus | ''
}

export interface RoleQueryParams extends PageParams {
  roleName?: string
  status?: RoleStatus
}

export interface CreateRoleParams {
  roleName: string
  roleCode: string
  status: RoleStatus
  remark: string
  permission: RolePermissionMap
}

export type UpdateRoleParams = CreateRoleParams

export interface RoleFormValues {
  roleName: string
  roleCode: string
  status: RoleStatus
  remark: string
  permission: RolePermissionMap
}
