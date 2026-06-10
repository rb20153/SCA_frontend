import type { TaskStatus, TaskType, ScanMode, TaskSourceMode, AutonomySourceMode, PageParams } from './common'

export interface DetectTask {
  taskId: string
  taskName: string
  taskType: TaskType
  status: TaskStatus
  progress: number          // 0–100
  projectId: string
  projectName: string
  /** 来源/模式：自主率为扫描模式，风险检测为数据来源 */
  sourceMode: TaskSourceMode
  createdAt: string         // ISO 8601
  startedAt?: string
  finishedAt?: string
  elapsedMs?: number
  totalAutonomyRate?: number
  netAutonomyRate?: number
  riskAutonomyRate?: number
  errorMsg?: string
  /** 失败自动重试次数（自主率任务可编辑） */
  retryCount?: number
}

export interface UpdateDetectTaskParams {
  taskName: string
  sourceMode: AutonomySourceMode
  retryCount: number
}

export interface TerminateTaskParams {
  reason: string
}

export interface CreateDetectTaskParams {
  taskName: string
  taskType: TaskType
  projectId: string
  scanMode: ScanMode
  policyId?: string
}

export interface TaskQueryParams extends Partial<PageParams> {
  taskName?: string
  taskType?: TaskType | ''
  projectId?: string
  /** 关联项目名称（模糊匹配） */
  projectName?: string
  status?: TaskStatus | ''
  startTime?: string
  endTime?: string
}

/** 检测任务列表页查询表单 */
export interface TaskListFilters {
  taskName: string
  taskType: TaskType | ''
  projectName: string
  status: TaskStatus | ''
}
