import type { PageResult, TaskType } from '@/types/common'
import type {
  AlertAssigneeOption,
  AlertCenterOverview,
  AlertDetail,
  AlertDisposition,
  AlertLevel,
  AlertListItem,
  AlertQueryParams,
  AlertRelatedProject,
  AlertRelatedTask,
  AlertTimeline,
  CreateDepartmentParams,
  CreateRoleParams,
  Department,
  DepartmentMemberCheckResult,
  DepartmentQueryParams,
  DepartmentStatus,
  HandleAlertParams,
  HandleAlertResult,
  LogDetail,
  LogExportParams,
  LogExportResult,
  LogListItem,
  LogQueryParams,
  LogResult,
  LogTimelineItem,
  Role,
  RolePermissionKey,
  RolePermissionMap,
  RoleQueryParams,
  RoleStatus,
  UpdateDepartmentParams,
  UpdateRoleParams,
} from '@/types/system'
import { ALERT_DISPOSITION } from '@/types/system'
import { normalizeList, normalizePageResult } from '@/utils/pageResultAdapter'
import { ALL_PERMISSION_KEYS } from '@/utils/rolePermissions'

/** 取第一个非空字符串 */
function pickFirstNonEmptyString(...candidates: unknown[]): string {
  for (const candidate of candidates) {
    const text = String(candidate ?? '').trim()
    if (text) {
      return text
    }
  }
  return ''
}

/** 规范布尔值（兼容 0/1、字符串 true/false） */
function normalizeBoolean(raw: unknown, fallback: boolean): boolean {
  if (raw === null || raw === undefined || raw === '') {
    return fallback
  }
  if (typeof raw === 'boolean') {
    return raw
  }
  const text = String(raw).toLowerCase()
  if (text === 'true' || text === '1') {
    return true
  }
  if (text === 'false' || text === '0') {
    return false
  }
  return fallback
}

/** 规范部门/角色启用状态 */
function normalizeEnabledStatus(raw: unknown): DepartmentStatus | RoleStatus {
  const text = String(raw ?? '').toLowerCase()
  if (text === 'disabled' || text === 'inactive' || text === '0' || text === 'false') {
    return 'disabled'
  }
  return 'enabled'
}

/** 解包分页 payload（兼容嵌套 data） */
function unwrapPageRaw(raw: unknown): unknown {
  if (Array.isArray(raw)) {
    return raw
  }
  if (!raw || typeof raw !== 'object') {
    return raw
  }
  const obj = raw as Record<string, unknown>
  if (obj.list ?? obj.items ?? obj.records) {
    return obj
  }
  if (obj.data !== undefined) {
    return unwrapPageRaw(obj.data)
  }
  return obj
}

/** 后端 permissions 中 `*` 为 true 表示拥有全部可配置权限 */
function isRolePermissionWildcard(raw: unknown): boolean {
  if (Array.isArray(raw)) {
    return raw.some((item) => String(item ?? '').trim() === '*')
  }
  if (!raw || typeof raw !== 'object') {
    return false
  }
  return normalizeBoolean((raw as Record<string, unknown>)['*'], false)
}

/** 将全部可配置权限设为同一布尔值 */
function fillAllRolePermissions(value: boolean): RolePermissionMap {
  return Object.fromEntries(
    ALL_PERMISSION_KEYS.map((key) => [key, value]),
  ) as RolePermissionMap
}

/**
 * 将后端 permissions 规范为 RolePermissionMap
 * @param raw - 对象键值或权限 key 数组；`*: true` 表示全部权限
 */
export function normalizeRolePermissions(raw: unknown): RolePermissionMap {
  if (isRolePermissionWildcard(raw)) {
    return fillAllRolePermissions(true)
  }

  const permissions = fillAllRolePermissions(false)

  if (Array.isArray(raw)) {
    for (const item of raw) {
      const key = String(item ?? '').trim() as RolePermissionKey
      if (ALL_PERMISSION_KEYS.includes(key)) {
        permissions[key] = true
      }
    }
    return permissions
  }

  if (!raw || typeof raw !== 'object') {
    return permissions
  }

  const obj = raw as Record<string, unknown>
  for (const key of ALL_PERMISSION_KEYS) {
    if (key in obj) {
      permissions[key] = normalizeBoolean(obj[key], false)
    }
  }
  return permissions
}

const ALERT_DISPOSITION_VALUES = new Set<string>(Object.values(ALERT_DISPOSITION))

/** 规范告警级别 */
function normalizeAlertLevel(raw: unknown): AlertLevel {
  const text = String(raw ?? '').toLowerCase()
  if (text === 'critical' || text === 'high' || text === 'severe') {
    return 'critical'
  }
  if (text === 'important' || text === 'warning' || text === 'medium') {
    return 'important'
  }
  return 'normal'
}

/** 规范告警队列状态 */
function normalizeAlertStatus(raw: unknown): AlertListItem['status'] {
  const text = String(raw ?? '').toLowerCase()
  if (text === 'handled' || text === 'resolved' || text === 'closed' || text === 'done') {
    return 'handled'
  }
  return 'pending'
}

/** 规范告警处置方式 */
function normalizeAlertDisposition(raw: unknown): AlertDisposition | undefined {
  const text = String(raw ?? '').trim()
  if (ALERT_DISPOSITION_VALUES.has(text)) {
    return text as AlertDisposition
  }
  return undefined
}

/** 规范关联任务类型 */
function normalizeAlertTaskType(raw: unknown): TaskType {
  const text = String(raw ?? '').toLowerCase()
  if (text.includes('risk') || text.includes('open')) {
    return 'open-source-risk'
  }
  if (text.includes('ai') || text.includes('parse')) {
    return 'ai-parse'
  }
  return 'autonomy'
}

/** 规范告警关联任务 */
function normalizeAlertRelatedTask(raw: unknown): AlertRelatedTask | undefined {
  if (!raw || typeof raw !== 'object') {
    return undefined
  }
  const obj = raw as Record<string, unknown>
  const taskId = pickFirstNonEmptyString(obj.taskId, obj.task_id, obj.id)
  if (!taskId) {
    return undefined
  }
  return {
    taskId,
    taskName: pickFirstNonEmptyString(obj.taskName, obj.task_name, obj.name),
    taskType: normalizeAlertTaskType(obj.taskType ?? obj.type),
  }
}

/** 规范告警关联项目 */
function normalizeAlertRelatedProject(raw: unknown): AlertRelatedProject | undefined {
  if (!raw || typeof raw !== 'object') {
    return undefined
  }
  const obj = raw as Record<string, unknown>
  const projectId = pickFirstNonEmptyString(obj.projectId, obj.project_id, obj.id)
  if (!projectId) {
    return undefined
  }
  return {
    projectId,
    projectName: pickFirstNonEmptyString(obj.projectName, obj.project_name, obj.name),
  }
}

/** 规范告警列表项 */
export function normalizeAlertListItem(raw: Record<string, unknown>): AlertListItem {
  const status = normalizeAlertStatus(raw.status)
  const handledAtRaw = raw.handledAt ?? raw.handled_at ?? raw.processedAt
  const isReadRaw = raw.isRead ?? raw.is_read ?? raw.read

  const item: AlertListItem = {
    alertId: pickFirstNonEmptyString(raw.alertId, raw.alert_id, raw.id),
    level: normalizeAlertLevel(raw.level ?? raw.severity),
    title: pickFirstNonEmptyString(raw.title, raw.alertTitle, raw.name),
    sourceModule: pickFirstNonEmptyString(
      raw.sourceModule,
      raw.source_module,
      raw.module,
      raw.source,
    ),
    occurredAt: String(raw.occurredAt ?? raw.occurred_at ?? raw.triggerTime ?? raw.createdAt ?? ''),
    status,
  }

  if (isReadRaw !== undefined && isReadRaw !== null && isReadRaw !== '') {
    item.isRead = normalizeBoolean(isReadRaw, false)
  }
  if (handledAtRaw !== undefined && handledAtRaw !== null && handledAtRaw !== '') {
    item.handledAt = String(handledAtRaw)
  }
  const handlerName = pickFirstNonEmptyString(raw.handlerName, raw.handler_name, raw.handler)
  if (handlerName) {
    item.handlerName = handlerName
  }
  const disposition = normalizeAlertDisposition(raw.disposition ?? raw.handleType)
  if (disposition) {
    item.disposition = disposition
  }

  return item
}

/** 规范告警分页结果 */
export function normalizeAlertPage(raw: unknown): PageResult<AlertListItem> {
  const page = normalizePageResult(unwrapPageRaw(raw), normalizeAlertListItem)
  if (page.list.length > 0 && page.total < page.list.length) {
    return { ...page, total: page.list.length }
  }
  return page
}

/** 规范告警中心概览统计 */
export function normalizeAlertCenterOverview(raw: unknown): AlertCenterOverview {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  return {
    criticalCount: Number(obj.criticalCount ?? obj.critical ?? obj.critical_count ?? 0),
    importantCount: Number(obj.importantCount ?? obj.important ?? obj.important_count ?? 0),
    normalCount: Number(obj.normalCount ?? obj.normal ?? obj.normal_count ?? 0),
  }
}

/** 规范告警详情 */
export function normalizeAlertDetail(raw: unknown, alertId?: string): AlertDetail {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const suggestionsRaw = obj.suggestions ?? obj.suggestionList ?? obj.advice
  const suggestions = Array.isArray(suggestionsRaw)
    ? suggestionsRaw.map((item) => String(item ?? '').trim()).filter(Boolean)
    : typeof suggestionsRaw === 'string' && suggestionsRaw.trim()
      ? [suggestionsRaw.trim()]
      : []

  const relatedTask = normalizeAlertRelatedTask(obj.relatedTask ?? obj.related_task ?? obj.task)
  const relatedProject = normalizeAlertRelatedProject(
    obj.relatedProject ?? obj.related_project ?? obj.project,
  )

  const handledAtRaw = obj.handledAt ?? obj.handled_at
  const handlerName = pickFirstNonEmptyString(obj.handlerName, obj.handler_name, obj.handler)

  const detail: AlertDetail = {
    alertId: pickFirstNonEmptyString(obj.alertId, obj.alert_id, obj.id, alertId),
    level: normalizeAlertLevel(obj.level ?? obj.severity),
    title: pickFirstNonEmptyString(obj.title, obj.alertTitle, obj.name),
    triggerRule: pickFirstNonEmptyString(obj.triggerRule, obj.trigger_rule, obj.rule),
    occurredAt: String(obj.occurredAt ?? obj.occurred_at ?? obj.triggerTime ?? ''),
    status: normalizeAlertStatus(obj.status),
    content: String(obj.content ?? obj.detail ?? obj.description ?? ''),
    suggestions,
  }

  if (relatedTask) {
    detail.relatedTask = relatedTask
  }
  if (relatedProject) {
    detail.relatedProject = relatedProject
  }
  if (handledAtRaw !== undefined && handledAtRaw !== null && handledAtRaw !== '') {
    detail.handledAt = String(handledAtRaw)
  }
  if (handlerName) {
    detail.handlerName = handlerName
  }

  return detail
}

/** 规范告警处置结果 */
export function normalizeHandleAlertResult(raw: unknown): HandleAlertResult {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const alertRaw = obj.alert ?? obj.data ?? obj
  const alertObj =
    alertRaw && typeof alertRaw === 'object' ? (alertRaw as Record<string, unknown>) : {}

  return {
    alert: normalizeAlertListItem(alertObj),
    movedToHandled: normalizeBoolean(obj.movedToHandled ?? obj.moved_to_handled, true),
  }
}

/** 规范转派候选人 */
export function normalizeAlertAssigneeOption(raw: Record<string, unknown>): AlertAssigneeOption {
  const userId = pickFirstNonEmptyString(raw.userId, raw.user_id, raw.id)
  const label = pickFirstNonEmptyString(
    raw.label,
    raw.name,
    raw.realName,
    raw.displayName,
    raw.username,
  )
  return { userId, label: label || userId }
}

/** 规范转派候选人列表 */
export function normalizeAlertAssigneeList(raw: unknown): AlertAssigneeOption[] {
  return normalizeList(raw, normalizeAlertAssigneeOption).filter((item) => item.userId)
}

/** 规范日志时间线条目 */
function normalizeLogTimelineItem(raw: Record<string, unknown>): LogTimelineItem {
  return {
    time: pickFirstNonEmptyString(raw.time, raw.timestamp, raw.at),
    message: pickFirstNonEmptyString(raw.message, raw.content, raw.text),
  }
}

/** 规范告警处理时间线 */
export function normalizeAlertTimeline(raw: unknown, alertId?: string): AlertTimeline {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const timelineRaw = obj.timeline ?? obj.items ?? obj.events
  const timeline = Array.isArray(timelineRaw)
    ? timelineRaw.map((item) => normalizeLogTimelineItem(item as Record<string, unknown>))
    : []

  return {
    alertId: pickFirstNonEmptyString(obj.alertId, obj.alert_id, obj.id, alertId),
    title: pickFirstNonEmptyString(obj.title, obj.alertTitle),
    handlerName: pickFirstNonEmptyString(obj.handlerName, obj.handler_name, obj.handler),
    timeline,
  }
}

/** 规范日志结果 */
function normalizeLogResult(raw: unknown): LogResult {
  const text = String(raw ?? '').toLowerCase()
  if (text === 'failure' || text === 'failed' || text === 'fail' || text === 'error') {
    return 'failure'
  }
  return 'success'
}

/** 规范日志列表项 */
export function normalizeLogListItem(raw: Record<string, unknown>): LogListItem {
  const relatedTaskId = pickFirstNonEmptyString(
    raw.relatedTaskId,
    raw.related_task_id,
    raw.taskId,
    raw.task_id,
  )

  const item: LogListItem = {
    logId: pickFirstNonEmptyString(raw.logId, raw.log_id, raw.id),
    traceId: pickFirstNonEmptyString(raw.traceId, raw.trace_id, raw.traceID),
    occurredAt: String(raw.occurredAt ?? raw.occurred_at ?? raw.createTime ?? raw.time ?? ''),
    username: pickFirstNonEmptyString(raw.username, raw.userName, raw.operator),
    module: pickFirstNonEmptyString(raw.module, raw.sourceModule, raw.bizModule),
    operation: pickFirstNonEmptyString(raw.operation, raw.action, raw.op),
    resourceObject: pickFirstNonEmptyString(
      raw.resourceObject,
      raw.resource_object,
      raw.resource,
      raw.object,
    ),
    ip: pickFirstNonEmptyString(raw.ip, raw.sourceIp, raw.source_ip, raw.clientIp),
    result: normalizeLogResult(raw.result ?? raw.success),
  }

  if (relatedTaskId) {
    item.relatedTaskId = relatedTaskId
  }

  return item
}

/** 规范日志分页结果 */
export function normalizeLogPage(raw: unknown): PageResult<LogListItem> {
  const page = normalizePageResult(unwrapPageRaw(raw), normalizeLogListItem)
  if (page.list.length > 0 && page.total < page.list.length) {
    return { ...page, total: page.list.length }
  }
  return page
}

/** 规范日志详情 */
export function normalizeLogDetail(raw: unknown, logId?: string): LogDetail {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const timelineRaw = obj.timeline ?? obj.items ?? obj.events
  const timeline = Array.isArray(timelineRaw)
    ? timelineRaw.map((item) => normalizeLogTimelineItem(item as Record<string, unknown>))
    : []

  return {
    logId: pickFirstNonEmptyString(obj.logId, obj.log_id, obj.id, logId),
    traceId: pickFirstNonEmptyString(obj.traceId, obj.trace_id, obj.traceID),
    username: pickFirstNonEmptyString(obj.username, obj.userName, obj.operator),
    sourceIp: pickFirstNonEmptyString(obj.sourceIp, obj.source_ip, obj.ip, obj.clientIp),
    result: normalizeLogResult(obj.result ?? obj.success),
    auditConclusion: pickFirstNonEmptyString(
      obj.auditConclusion,
      obj.audit_conclusion,
      obj.conclusion,
      obj.summary,
    ),
    timeline,
    rawLogExcerpt: String(obj.rawLogExcerpt ?? obj.raw_log_excerpt ?? obj.rawLog ?? obj.log ?? ''),
  }
}

/** 规范日志导出结果 */
export function normalizeLogExportResult(raw: unknown): LogExportResult {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  return {
    downloadUrl: pickFirstNonEmptyString(obj.downloadUrl, obj.download_url, obj.url),
    fileName: pickFirstNonEmptyString(obj.fileName, obj.file_name, obj.filename, 'logs-export.csv'),
  }
}

/**
 * 告警处置请求体 → 后端 body（处理人由后端从 token 解析）
 * @param data - 处置参数
 */
export function handleAlertParamsToApi(data: HandleAlertParams): Record<string, unknown> {
  const body: Record<string, unknown> = {
    disposition: data.disposition,
  }
  if (data.remark?.trim()) {
    body.remark = data.remark.trim()
  }
  if (data.assigneeUserId) {
    body.assigneeUserId = data.assigneeUserId
  }
  if (data.plannedCompleteAt) {
    body.plannedCompleteAt = data.plannedCompleteAt
  }
  if (data.notifyAuditor !== undefined) {
    body.notifyAuditor = data.notifyAuditor
  }
  if (data.notifyTaskOwner !== undefined) {
    body.notifyTaskOwner = data.notifyTaskOwner
  }
  if (data.notifyOps !== undefined) {
    body.notifyOps = data.notifyOps
  }
  return body
}

/**
 * 日志导出请求体 → 后端 body
 * @param params - 导出参数
 */
export function logExportParamsToApi(params: LogExportParams): Record<string, unknown> {
  return {
    startTime: params.startTime,
    endTime: params.endTime,
    format: params.format,
  }
}

/** 规范部门列表项 */
export function normalizeDepartment(raw: Record<string, unknown>): Department {
  return {
    departmentId: pickFirstNonEmptyString(raw.departmentId, raw.department_id, raw.id),
    departmentName: pickFirstNonEmptyString(
      raw.departmentName,
      raw.department_name,
      raw.name,
    ),
    status: normalizeEnabledStatus(raw.status),
    remark: String(raw.remark ?? raw.description ?? ''),
    createdAt: String(raw.createdAt ?? raw.created_at ?? raw.createTime ?? ''),
    memberCount: Number(raw.memberCount ?? raw.member_count ?? raw.userCount ?? 0),
  }
}

/** 规范部门分页结果 */
export function normalizeDepartmentPage(raw: unknown): PageResult<Department> {
  const page = normalizePageResult(unwrapPageRaw(raw), normalizeDepartment)
  if (page.list.length > 0 && page.total < page.list.length) {
    return { ...page, total: page.list.length }
  }
  return page
}

/** 规范删除前成员检查结果 */
export function normalizeDepartmentMemberCheck(raw: unknown): DepartmentMemberCheckResult {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const memberCount = Number(obj.memberCount ?? obj.member_count ?? obj.count ?? 0)
  const hasMembers = normalizeBoolean(
    obj.hasMembers ?? obj.has_members ?? (memberCount > 0 ? true : undefined),
    memberCount > 0,
  )
  return { hasMembers, memberCount }
}

/** 规范角色列表项 */
export function normalizeRole(raw: Record<string, unknown>): Role {
  return {
    roleId: pickFirstNonEmptyString(raw.roleId, raw.role_id, raw.id),
    roleName: pickFirstNonEmptyString(raw.roleName, raw.role_name, raw.name),
    roleCode: pickFirstNonEmptyString(raw.roleCode, raw.role_code, raw.code),
    status: normalizeEnabledStatus(raw.status),
    remark: String(raw.remark ?? raw.description ?? ''),
    isBuiltin: normalizeBoolean(
      raw.isBuiltin ?? raw.is_builtin ?? raw.builtin ?? raw.systemBuiltIn,
      false,
    ),
    permissions: normalizeRolePermissions(raw.permissions ?? raw.permissionList),
    createdAt: String(raw.createdAt ?? raw.created_at ?? raw.createTime ?? ''),
    boundUserCount: Number(
      raw.boundUserCount ?? raw.bound_user_count ?? raw.userCount ?? raw.memberCount ?? 0,
    ),
  }
}

/** 规范角色分页结果 */
export function normalizeRolePage(raw: unknown): PageResult<Role> {
  const page = normalizePageResult(unwrapPageRaw(raw), normalizeRole)
  if (page.list.length > 0 && page.total < page.list.length) {
    return { ...page, total: page.list.length }
  }
  return page
}

/**
 * 查询参数 → 后端 query（空值不下发）
 * @param params - 分页与筛选
 */
export function systemQueryParamsToApi(
  params:
    | DepartmentQueryParams
    | RoleQueryParams
    | AlertQueryParams
    | LogQueryParams,
): Record<string, unknown> {
  const query: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') {
      continue
    }
    query[key] = value
  }
  return query
}

/**
 * 新增部门请求体 → 后端 body
 * @param data - 创建参数
 */
export function createDepartmentParamsToApi(
  data: CreateDepartmentParams,
): Record<string, unknown> {
  return {
    departmentName: data.departmentName.trim(),
    status: data.status,
    remark: data.remark.trim(),
  }
}

/**
 * 更新部门请求体 → 后端 body
 * @param data - 更新参数
 */
export function updateDepartmentParamsToApi(
  data: UpdateDepartmentParams,
): Record<string, unknown> {
  return createDepartmentParamsToApi(data)
}

/**
 * 新增/更新角色请求体 → 后端 body
 * @param data - 创建或更新参数
 */
export function roleParamsToApi(
  data: CreateRoleParams | UpdateRoleParams,
): Record<string, unknown> {
  return {
    roleName: data.roleName.trim(),
    roleCode: data.roleCode.trim(),
    status: data.status,
    remark: data.remark.trim(),
    permissions: data.permissions,
  }
}
