import type { PageResult, TaskSourceMode, TaskStatus, TaskType } from '@/types/common'
import type {
  DetectTask,
  DetectTaskProjectOption,
  TaskQueryParams,
  VulnDbVersionOption,
} from '@/types/detect'
import { normalizeList, normalizePageResult } from '@/utils/pageResultAdapter'

/** 后端任务 status → 前端 TaskStatus */
const TASK_STATUS_MAP: Record<string, TaskStatus> = {
  completed: 'success',
  success: 'success',
  done: 'success',
  running: 'running',
  in_progress: 'running',
  queued: 'queued',
  pending: 'queued',
  paused: 'paused',
  failed: 'failed',
  error: 'failed',
  terminated: 'terminated',
  canceled: 'terminated',
  cancelled: 'terminated',
}

/** 自主率 scanMode → 前端 sourceMode */
const AUTONOMY_SCAN_MODE_MAP: Record<string, TaskSourceMode> = {
  full: 'full-scan',
  'full-scan': 'full-scan',
  incremental: 'incremental-scan',
  'incremental-scan': 'incremental-scan',
  quick: 'quick-scan',
  'quick-scan': 'quick-scan',
}

/**
 * 规范 taskType（兼容 type 字段）
 *
 * 后端实际返回的是 `type`，取值除 openapi 定义的两种外还有 `combined`（自主率 + 风险一次跑完），
 * 这类无法归到某一侧的值按调用方上下文处理：自主率页当自主率、风险页当风险，两边都能看到
 *
 * @param raw - 后端 taskType / type
 * @param fallback - 识别不出类型时的兜底（列表页传当前页面固定的 taskType）
 */
function normalizeTaskType(raw: unknown, fallback: TaskType = 'autonomy'): TaskType {
  const value = String(raw ?? '').toLowerCase()
  if (value === 'open-source-risk' || value === 'risk' || value === 'opensource') {
    return 'open-source-risk'
  }
  if (value === 'autonomy' || value === 'autonomy-rate') {
    return 'autonomy'
  }
  return fallback
}

/** 规范 sourceMode（兼容 scanMode / dataSource；自主率 full → full-scan） */
function normalizeSourceMode(raw: unknown, taskType: TaskType): TaskSourceMode {
  const value = String(raw ?? '').toLowerCase()
  if (taskType === 'autonomy') {
    return AUTONOMY_SCAN_MODE_MAP[value] ?? 'full-scan'
  }
  if (value === 'import-sbom' || value === 'sbom') return 'import-sbom'
  return 'project-scan'
}

/** 规范任务 status（completed → success） */
function normalizeTaskStatus(raw: unknown): TaskStatus {
  const key = String(raw ?? '').toLowerCase()
  return TASK_STATUS_MAP[key] ?? 'queued'
}

/** 由 createdAt / updatedAt 推算耗时（后端 elapsedMs 为 0 时兜底） */
function resolveElapsedMs(raw: Record<string, unknown>): number | undefined {
  const direct = Number(raw.elapsedMs)
  if (!Number.isNaN(direct) && direct > 0) return direct

  const createdAt = raw.createdAt ? new Date(String(raw.createdAt)).getTime() : NaN
  const finishedAt = raw.finishedAt
    ? new Date(String(raw.finishedAt)).getTime()
    : raw.updatedAt
      ? new Date(String(raw.updatedAt)).getTime()
      : NaN

  if (!Number.isNaN(createdAt) && !Number.isNaN(finishedAt) && finishedAt >= createdAt) {
    return finishedAt - createdAt
  }
  return undefined
}

/**
 * 将后端检测任务对象映射为前端 DetectTask
 * 兼容 id/name、scanMode/dataSource、completed 等后端写法
 * @param raw - 后端任务对象
 * @param fallbackTaskType - 后端漏返 taskType 时按调用方上下文兜底（如开源风险列表页）
 */
export function normalizeDetectTask(
  raw: Record<string, unknown>,
  fallbackTaskType: TaskType = 'autonomy',
): DetectTask {
  const taskType = normalizeTaskType(raw.taskType ?? raw.type, fallbackTaskType)
  return {
    taskId: String(raw.taskId ?? raw.id ?? ''),
    taskName: String(raw.taskName ?? raw.name ?? ''),
    taskType,
    status: normalizeTaskStatus(raw.status),
    progress: Number(raw.progress ?? 0),
    projectId: String(raw.projectId ?? ''),
    projectName: String(raw.projectName ?? ''),
    sourceMode: normalizeSourceMode(raw.sourceMode ?? raw.scanMode ?? raw.dataSource, taskType),
    createdAt: String(raw.createdAt ?? ''),
    startedAt: raw.startedAt ? String(raw.startedAt) : undefined,
    finishedAt: raw.finishedAt ? String(raw.finishedAt) : undefined,
    elapsedMs: resolveElapsedMs(raw),
    totalAutonomyRate:
      raw.totalAutonomyRate !== undefined ? Number(raw.totalAutonomyRate) : undefined,
    netAutonomyRate: raw.netAutonomyRate !== undefined ? Number(raw.netAutonomyRate) : undefined,
    riskAutonomyRate:
      raw.riskAutonomyRate !== undefined ? Number(raw.riskAutonomyRate) : undefined,
    errorMsg: raw.errorMsg ? String(raw.errorMsg) : undefined,
    retryCount: raw.retryCount !== undefined ? Number(raw.retryCount) : undefined,
    vulnDbVersion: raw.vulnDbVersion ? String(raw.vulnDbVersion) : undefined,
  }
}

/**
 * 规范检测任务分页结果（兼容 list / items / records）
 *
 * 后端目前会忽略 `taskType` 查询条件，把另一类任务也返回给分类列表页，
 * 因此传了 `expectedTaskType` 时会按类型二次过滤：
 * 只保留类型匹配的行，`total` 按本页剔除数量同步减掉（后端修好后过滤自然失效）
 *
 * @param raw - 后端分页对象
 * @param expectedTaskType - 列表页固定的检测类型
 */
export function normalizeDetectTaskPage(
  raw: unknown,
  expectedTaskType?: TaskType,
): PageResult<DetectTask> {
  const page = normalizePageResult(raw, (item) => normalizeDetectTask(item, expectedTaskType))
  if (!expectedTaskType) return page

  const list = page.list.filter((task) => task.taskType === expectedTaskType)
  const dropped = page.list.length - list.length
  return { ...page, list, total: Math.max(page.total - dropped, list.length) }
}

/**
 * 判断后端响应体是否携带任务主体
 * 暂停/继续/终止等接口部分只回 `{ reason }`，此时需要回查任务详情
 */
export function hasDetectTaskBody(raw: unknown): raw is Record<string, unknown> {
  if (!raw || typeof raw !== 'object') return false
  const obj = raw as Record<string, unknown>
  return Boolean(obj.taskId ?? obj.id)
}

/** 取第一个非空字符串；后端存在把字段返回成 `""` 而非省略的情况，`??` 挡不住 */
function firstNonEmpty(...values: unknown[]): string {
  for (const value of values) {
    const text = String(value ?? '').trim()
    if (text) return text
  }
  return ''
}

/** 规范创建任务弹窗的关联项目下拉项 */
export function normalizeDetectTaskProjectOptions(raw: unknown): DetectTaskProjectOption[] {
  return normalizeList(raw, (item) => {
    const projectId = firstNonEmpty(item.projectId, item.id)
    return { projectId, projectName: firstNonEmpty(item.projectName, item.name, projectId) }
  }).filter((item) => item.projectId !== '')
}

/**
 * 规范开源风险漏洞库版本下拉项
 * 后端目前 `version` / `label` 都返回空串，真正能用的是 `id` 与 `name`，因此按非空优先级回退
 */
export function normalizeVulnDbVersionOptions(raw: unknown): VulnDbVersionOption[] {
  return normalizeList(raw, (item) => {
    const version = firstNonEmpty(item.version, item.value, item.id)
    return { version, label: firstNonEmpty(item.label, item.name, version) }
  }).filter((item) => item.version !== '')
}

/**
 * 将任务列表查询参数转为后端 query（剔除空串与 undefined，避免全部筛选被清空）
 * @param params - 页面筛选 + 分页参数
 */
export function detectTaskQueryParamsToApi(params: TaskQueryParams): Record<string, unknown> {
  const query: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    query[key] = value
  }
  return query
}
