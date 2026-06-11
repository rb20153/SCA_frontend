// ─── Universal API wrapper ────────────────────────────────────────────────────
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

export interface PageParams {
  page: number
  pageSize: number
}

/** 统计卡片单项（StatCard / StatCardRow 通用） */
export interface StatCardItem {
  key: string
  label: string
  /** 展示用主数值，由页面侧格式化后传入 */
  value: string
  /** 环比增量；有值时展示增长率行 */
  growth?: number
  growthSuffix?: string
  /** 主数值是否使用警告色 */
  warnValue?: boolean
  /** 卡片底部操作链接文案（与 linkTo 同时传入） */
  linkLabel?: string
  /** 操作链接跳转路径 */
  linkTo?: string
}

// ─── SCA Domain canonical types ───────────────────────────────────────────────

/** 任务运行状态（列表展示仅 6 种） */
export type TaskStatus =
  | 'queued'
  | 'running'
  | 'success'
  | 'paused'
  | 'terminated'
  | 'failed'

/** Terminal states where polling should stop */
export const TERMINAL_STATUSES: TaskStatus[] = ['success', 'failed', 'terminated']

/** Risk severity */
export type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'info'

/** License parse mode */
export type ParseMode = 'ai' | 'rule' | 'fallback'

/** Scan mode */
export type ScanMode = 'full' | 'incremental' | 'resume'

/** Task type */
export type TaskType = 'autonomy' | 'open-source-risk'

// ─── Status display helpers ───────────────────────────────────────────────────

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  queued: '排队中',
  running: '运行中',
  success: '已完成',
  paused: '已暂停',
  terminated: '已终止',
  failed: '失败',
}

export const TASK_STATUS_COLOR: Record<TaskStatus, string> = {
  queued: 'default',
  running: 'processing',
  success: 'success',
  paused: 'orange',
  terminated: 'default',
  failed: 'error',
}

/** 自主率任务的扫描模式 */
export type AutonomySourceMode = 'full-scan' | 'incremental-scan' | 'quick-scan'

/** 开源风险任务的数据来源 */
export type RiskSourceMode = 'project-scan' | 'import-sbom'

/** 来源/模式：随 taskType 含义不同 */
export type TaskSourceMode = AutonomySourceMode | RiskSourceMode

export const RISK_LEVEL_COLOR: Record<RiskLevel, string> = {
  critical: '#ff4d4f',
  high: '#fa8c16',
  medium: '#faad14',
  low: '#52c41a',
  info: '#1677ff',
}

export const RISK_LEVEL_LABEL: Record<RiskLevel, string> = {
  critical: '严重',
  high: '高危',
  medium: '中危',
  low: '低危',
  info: '提示',
}
