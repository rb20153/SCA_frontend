import type {
  TaskStatus,
  TaskType,
  TaskSourceMode,
  AutonomySourceMode,
  TaskExecutionMode,
  RiskScanScope,
  RiskDependencyDepth,
  RiskSourceMode,
  PageParams,
} from './common'

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

/** 检测任务创建弹窗：关联项目下拉项 */
export interface DetectTaskProjectOption {
  projectId: string
  projectName: string
}

/** 开源风险检测：漏洞库版本选项 */
export interface VulnDbVersionOption {
  version: string
  label: string
}

export interface CreateAutonomyDetectTaskParams {
  taskType: 'autonomy'
  taskName: string
  projectId: string
  scanMode: AutonomySourceMode
  executionMode: TaskExecutionMode
  workerCount: number
  autoRetryEnabled: boolean
  retryCount?: number
}

export interface CreateRiskDetectTaskParams {
  taskType: 'open-source-risk'
  taskName: string
  projectId: string
  /** 数据来源：扫描项目 / 导入 SBOM */
  dataSource: RiskSourceMode
  /** 扫描项目时必填 */
  scanScope?: RiskScanScope
  vulnDbVersion?: string
  dependencyDepth?: RiskDependencyDepth
  /** 导入 SBOM 时必填 */
  sbomFile?: File
}

export type CreateDetectTaskParams = CreateAutonomyDetectTaskParams | CreateRiskDetectTaskParams

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
