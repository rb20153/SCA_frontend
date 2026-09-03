import type { Router } from 'vue-router'
import type { TaskSourceMode, TaskStatus, TaskType } from '@/types/common'
import type { DetectTask } from '@/types/detect'
import { appendFromQuery, createNavigationState } from '@/utils/navigation'
import { QUEUED_TASK_DISPLAY_PROGRESS } from '@/utils/taskCreate'

/** 检测类型中文文案 */
export const TASK_TYPE_LABEL: Record<TaskType, string> = {
  autonomy: '自主率检测',
  'open-source-risk': '开源风险检测',
}

/** 检测类型 Tag 颜色（避开蓝/绿/红，避免与运行状态 Tag 撞色） */
export const TASK_TYPE_TAG_COLOR: Record<TaskType, string> = {
  autonomy: 'purple',
  'open-source-risk': 'magenta',
}

/** 来源/模式中文文案 */
export const TASK_SOURCE_MODE_LABEL: Record<TaskSourceMode, string> = {
  'full-scan': '全量扫描',
  'incremental-scan': '增量扫描',
  'quick-scan': '快速扫描',
  'project-scan': '项目扫描',
  'import-sbom': '导入SBOM',
}

/**
 * 将毫秒格式化为「xhxxm」，不足 1 小时只显示分钟
 * @param ms - 耗时毫秒数
 */
export function formatDurationMs(ms: number | undefined): string {
  if (ms === undefined || ms <= 0) return '—'
  if (ms < 1_000) return `${Math.max(1, Math.round(ms))} 毫秒`
  if (ms < 60_000) {
    const seconds = ms < 10_000 ? Math.round(ms / 100) / 10 : Math.round(ms / 1_000)
    return `${seconds} 秒`
  }
  const totalMinutes = Math.floor(ms / 60_000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const seconds = Math.floor((ms % 60_000) / 1_000)
  if (hours <= 0) return seconds > 0 ? `${minutes} 分 ${seconds} 秒` : `${minutes} 分钟`
  if (minutes <= 0) return `${hours} 小时`
  return `${hours} 小时 ${minutes} 分`
}

/**
 * 格式化首页统计卡片的增长文案
 * @param growth - 增量（可为负）
 * @param suffix - 单位后缀，如 `%`
 */
export function formatStatGrowth(growth: number, suffix = ''): string {
  const sign = growth > 0 ? '+' : ''
  return `增长 ${sign}${growth}${suffix}`
}

/** 失败任务跳转日志列表（按任务 TraceID 筛选，直接定位任务执行链路） */
export function getTaskLogListRoute(task: DetectTask) {
  return {
    path: '/system/logs',
    query: task.traceId ? { traceId: task.traceId } : undefined,
  }
}

/** 自主率 / 开源风险分类列表路由 */
export const DETECT_AUTONOMY_LIST_PATH = '/detect/autonomy'
export const DETECT_RISK_LIST_PATH = '/detect/risk'

/** 自主率检测结果页路径 */
export function getAutonomyDetectResultPath(taskId: string): string {
  return `${DETECT_AUTONOMY_LIST_PATH}/${taskId}/result`
}

/** 开源风险检测结果页路径 */
export function getOpenSourceRiskDetailPath(taskId: string): string {
  return `${DETECT_RISK_LIST_PATH}/${taskId}`
}

/** 根据检测类型返回对应结果页路由 */
export function getTaskResultRoute(task: DetectTask) {
  if (task.taskType === 'autonomy') {
    return { name: 'AutonomyDetectResult', params: { taskId: task.taskId } }
  }
  return { name: 'OpenSourceRiskDetail', params: { taskId: task.taskId } }
}

/**
 * 跳转检测结果页，并通过 history.state 携带任务数据
 * @param router - Vue Router 实例
 * @param task - 当前任务
 * @param fromFullPath - 来源页 fullPath，用于顶栏返回
 */
export function navigateToTaskResult(
  router: Router,
  task: DetectTask,
  fromFullPath: string,
): void {
  const target = appendFromQuery(getTaskResultRoute(task), fromFullPath)
  void router.push(
    typeof target === 'string'
      ? target
      : {
          ...target,
          state: createNavigationState({ task }),
        },
  )
}

/** 列表展示的进度百分比（排队中固定 10%） */
export function getTaskDisplayProgress(task: DetectTask): number {
  if (task.status === 'queued') {
    return QUEUED_TASK_DISPLAY_PROGRESS
  }
  return task.progress
}

/** 进度条状态：与运行状态联动 */
export function getTaskProgressStatus(
  status: TaskStatus,
): 'success' | 'exception' | 'active' | 'normal' | undefined {
  if (status === 'success') return 'success'
  if (status === 'failed' || status === 'terminated') return 'exception'
  if (status === 'running') return 'active'
  return 'normal'
}

const COL_WIDTH = {
  taskName: 180,
  taskType: 130,
  project: 160,
  sourceMode: 120,
  status: 120,
  progress: 140,
  elapsed: 100,
  action: 110,
  actionFull: 220,
} as const

/** 首页最近任务表格 scroll.x */
export const DETECT_TASK_TABLE_SCROLL_X =
  COL_WIDTH.taskName +
  COL_WIDTH.taskType +
  COL_WIDTH.project +
  COL_WIDTH.status +
  COL_WIDTH.progress +
  COL_WIDTH.elapsed +
  COL_WIDTH.action

/** 无「项目」列的任务表格 scroll.x（项目详情关联任务等） */
export const DETECT_TASK_TABLE_NO_PROJECT_SCROLL_X =
  COL_WIDTH.taskName +
  COL_WIDTH.taskType +
  COL_WIDTH.status +
  COL_WIDTH.progress +
  COL_WIDTH.elapsed +
  COL_WIDTH.action

/** 检测任务列表页 scroll.x（含检测类型、来源/模式列与完整操作列） */
export const DETECT_TASK_LIST_SCROLL_X =
  COL_WIDTH.taskName +
  COL_WIDTH.taskType +
  COL_WIDTH.project +
  COL_WIDTH.sourceMode +
  COL_WIDTH.status +
  COL_WIDTH.progress +
  COL_WIDTH.elapsed +
  COL_WIDTH.actionFull

/** 分类列表页 scroll.x（无检测类型列，含模式/来源列与完整操作列） */
export const DETECT_TASK_SPLIT_LIST_SCROLL_X =
  COL_WIDTH.taskName +
  COL_WIDTH.project +
  COL_WIDTH.sourceMode +
  COL_WIDTH.status +
  COL_WIDTH.progress +
  COL_WIDTH.elapsed +
  COL_WIDTH.actionFull

/** 无项目列且无检测类型列的任务表格 scroll.x */
export const DETECT_TASK_TABLE_NO_PROJECT_NO_TYPE_SCROLL_X =
  DETECT_TASK_TABLE_NO_PROJECT_SCROLL_X - COL_WIDTH.taskType
