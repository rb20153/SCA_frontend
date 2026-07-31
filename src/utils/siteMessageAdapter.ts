import type { PageResult, TaskType } from '@/types/common'
import type {
  SiteMessage,
  SiteMessageAction,
  SiteMessageActionType,
  SiteMessageListQuery,
  SiteMessageType,
} from '@/types/siteMessage'
import { normalizePageResult } from '@/utils/pageResultAdapter'

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

/** 统一成小写下划线形式，便于比对后端枚举写法 */
function toSnakeLower(raw: unknown): string {
  return String(raw ?? '')
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toLowerCase()
}

/** 宽松布尔解析：兼容 true / 'true' / 1 / '1' / 'read' */
function normalizeBoolean(raw: unknown, fallback = false): boolean {
  if (raw === undefined || raw === null || raw === '') {
    return fallback
  }
  if (typeof raw === 'boolean') {
    return raw
  }
  const text = String(raw).trim().toLowerCase()
  if (text === 'read') {
    return true
  }
  if (text === 'unread') {
    return false
  }
  if (text === 'false' || text === '0' || text === 'n' || text === 'no') {
    return false
  }
  if (text === 'true' || text === '1' || text === 'y' || text === 'yes') {
    return true
  }
  return fallback
}

/** 解包可能被再包一层 data 的分页 payload */
function unwrapPageRaw(raw: unknown): unknown {
  if (Array.isArray(raw) || !raw || typeof raw !== 'object') {
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

// ─── 消息类型映射 ─────────────────────────────────────────────────────────────

/** 前端消息类型 → 后端短枚举（openapi: task/approval/alert/report/system） */
const SITE_MESSAGE_TYPE_TO_API: Record<SiteMessageType, string> = {
  task_notice: 'task',
  approval_reminder: 'approval',
  alert_notice: 'alert',
  report_notice: 'report',
  system_announcement: 'system',
}

/** 后端消息类型 → 前端消息类型（同时接受后端直接回传前端长枚举） */
const API_TO_SITE_MESSAGE_TYPE: Record<string, SiteMessageType> = {
  task: 'task_notice',
  task_notice: 'task_notice',
  approval: 'approval_reminder',
  approval_reminder: 'approval_reminder',
  alert: 'alert_notice',
  alert_notice: 'alert_notice',
  report: 'report_notice',
  report_notice: 'report_notice',
  system: 'system_announcement',
  system_announcement: 'system_announcement',
  announcement: 'system_announcement',
}

/** 规范站内消息类型，未知值按系统公告处理（不会误触发跳转按钮） */
function normalizeSiteMessageType(raw: unknown): SiteMessageType {
  return API_TO_SITE_MESSAGE_TYPE[toSnakeLower(raw)] ?? 'system_announcement'
}

// ─── 消息主操作映射 ───────────────────────────────────────────────────────────

const ACTION_TYPES: readonly SiteMessageActionType[] = [
  'view_task_result',
  'go_approval',
  'view_alert',
  'view_knowledge',
  'change_password',
  'view_report',
]

/** 操作按钮默认文案（后端未返回 label 时使用） */
const ACTION_DEFAULT_LABEL: Record<SiteMessageActionType, string> = {
  view_task_result: '查看结果',
  go_approval: '去审批',
  view_alert: '查看告警',
  view_knowledge: '查看知识库',
  change_password: '去修改密码',
  view_report: '查看报告',
}

/** 规范任务类型（自主率 / 开源风险），兼容下划线写法 */
function normalizeTaskType(raw: unknown): TaskType | undefined {
  const text = toSnakeLower(raw)
  if (text === 'autonomy') {
    return 'autonomy'
  }
  if (text === 'open_source_risk' || text === 'opensource_risk' || text === 'risk') {
    return 'open-source-risk'
  }
  return undefined
}

/**
 * 规范消息主操作；类型缺失或不认识时返回 null（表格只显示已读切换）
 * @param raw - 后端 action 对象
 */
function normalizeSiteMessageAction(raw: unknown): SiteMessageAction | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const obj = raw as Record<string, unknown>
  const type = toSnakeLower(obj.type ?? obj.actionType ?? obj.action_type)
  if (!(ACTION_TYPES as readonly string[]).includes(type)) {
    return null
  }

  const actionType = type as SiteMessageActionType
  const taskType = normalizeTaskType(obj.taskType ?? obj.task_type)
  const taskId = pickFirstNonEmptyString(obj.taskId, obj.task_id)
  const policyId = pickFirstNonEmptyString(obj.policyId, obj.policy_id)
  const reportId = pickFirstNonEmptyString(obj.reportId, obj.report_id)
  const alertId = pickFirstNonEmptyString(obj.alertId, obj.alert_id)

  return {
    type: actionType,
    label: pickFirstNonEmptyString(obj.label, obj.text) || ACTION_DEFAULT_LABEL[actionType],
    ...(taskType ? { taskType } : {}),
    ...(taskId ? { taskId } : {}),
    ...(policyId ? { policyId } : {}),
    ...(reportId ? { reportId } : {}),
    ...(alertId ? { alertId } : {}),
  }
}

/**
 * 规范站内消息列表项
 * @param raw - 后端单条消息对象
 * summary 缺失时用 content 截断兜底，保证列表摘要列不空白
 */
export function normalizeSiteMessage(raw: Record<string, unknown>): SiteMessage {
  const content = pickFirstNonEmptyString(raw.content, raw.body, raw.detail)
  const summary = pickFirstNonEmptyString(raw.summary, raw.brief, raw.digest)

  return {
    messageId: pickFirstNonEmptyString(raw.messageId, raw.message_id, raw.id),
    type: normalizeSiteMessageType(raw.type ?? raw.messageType ?? raw.message_type),
    title: pickFirstNonEmptyString(raw.title, raw.subject),
    summary: summary || content.slice(0, 60),
    content: content || summary,
    recipientUserId: pickFirstNonEmptyString(raw.recipientUserId, raw.recipient_user_id, raw.userId),
    recipientUsername: pickFirstNonEmptyString(
      raw.recipientUsername,
      raw.recipient_username,
      raw.username,
    ),
    createdAt: pickFirstNonEmptyString(raw.createdAt, raw.created_at, raw.createTime, raw.sendTime),
    // 后端可能用 read / isRead / readStatus 表达已读
    read: normalizeBoolean(raw.read ?? raw.isRead ?? raw.is_read ?? raw.readStatus),
    action: normalizeSiteMessageAction(raw.action ?? raw.actionInfo ?? raw.action_info),
  }
}

/**
 * 规范站内消息分页结果
 * @param raw - 后端分页 payload（兼容 list/items/records）
 */
export function normalizeSiteMessagePage(raw: unknown): PageResult<SiteMessage> {
  return normalizePageResult(unwrapPageRaw(raw), normalizeSiteMessage)
}

/**
 * 站内消息查询参数 → 后端 query
 * @param params - 接收人、类型、标题、已读状态、分页
 * type 需转成后端短枚举（task/approval/...），空值不下发
 */
export function siteMessageQueryToApi(params: SiteMessageListQuery): Record<string, unknown> {
  const query: Record<string, unknown> = {
    recipientUsername: params.recipientUsername,
    page: params.page,
    pageSize: params.pageSize,
  }

  if (params.type) {
    query.type = SITE_MESSAGE_TYPE_TO_API[params.type] ?? params.type
  }
  const title = params.title?.trim()
  if (title) {
    query.title = title
  }
  if (params.readStatus) {
    query.readStatus = params.readStatus
  }

  return query
}

/**
 * 规范「全部标为已读」返回的更新条数
 * @param raw - 后端响应 data
 * 后端只回 null / 空对象时按 0 处理，页面会提示「暂无未读消息」
 */
export function normalizeMarkAllReadResult(raw: unknown): { updatedCount: number } {
  if (typeof raw === 'number') {
    return { updatedCount: raw }
  }
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const count = Number(obj.updatedCount ?? obj.updated_count ?? obj.count ?? obj.total ?? 0)
  return { updatedCount: Number.isFinite(count) ? count : 0 }
}
