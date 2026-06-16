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
  /** 开源风险任务：漏洞库版本（如 2026.05） */
  vulnDbVersion?: string
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

/** 开源风险详情 · 顶部任务摘要（列表跳转经 state 携带） */
export interface OpenSourceRiskDetailHeadInfo {
  taskId: string
  projectName: string
  taskName: string
  status: TaskStatus
  /** 完成时间 ISO；未完成时为 null */
  finishedAt: string | null
  /** 数据来源展示文案 */
  dataSourceLabel: string
  /** 漏洞库版本 */
  vulnDbVersion: string
}

/** 开源风险详情 · 结果统计摘要 */
export interface OpenSourceRiskDetailSummary {
  identifiedComponentCount: number
  highRiskVulnCount: number
  pendingCount: number
  licenseRiskCount: number
}

/** 开源风险详情 Tab key */
export type OpenSourceRiskDetailTabKey = 'components' | 'vulnerabilities' | 'sbom'

/** 开源风险 · 组件清单风险等级（筛选与列表） */
export type OpenSourceRiskComponentRiskLevel = 'high' | 'medium' | 'low'

/** 开源风险 · 组件识别依据 */
export type OpenSourceRiskComponentIdentifyBasis =
  | 'cmake'
  | 'symbol'
  | 'manifest'
  | 'sbom'

/** 开源风险 · 组件忽略原因 */
export type OpenSourceRiskComponentIgnoreReason =
  | 'misidentification'
  | 'internal'
  | 'covered'
  | 'other'

/** 开源风险 · 组件清单项 */
export interface OpenSourceRiskComponent {
  componentId: string
  componentName: string
  version: string
  license: string
  identifyBasis: OpenSourceRiskComponentIdentifyBasis
  /** 识别依据展示文案 */
  identifyBasisLabel: string
  /** 来源：项目扫描 / 导入 SBOM */
  sourceMode: RiskSourceMode
  riskLevel: OpenSourceRiskComponentRiskLevel
  /** 是否已忽略（仍可在清单中展示，统计与报告不计入） */
  ignored: boolean
  /** 忽略原因；未忽略时为 null */
  ignoreReason: OpenSourceRiskComponentIgnoreReason | null
}

/** 忽略组件请求体 */
export interface IgnoreOpenSourceRiskComponentParams {
  reason: OpenSourceRiskComponentIgnoreReason
}

/** 开源风险 · 组件详情（抽屉） */
export interface OpenSourceRiskComponentDetail extends OpenSourceRiskComponent {
  /** 识别依据详细说明 */
  identifyBasisDetail: string
  /** 关联漏洞条数 */
  relatedVulnerabilityCount: number
}

/** 开源风险 · 组件清单筛选表单 */
export interface OpenSourceRiskComponentListFilters {
  /** 组件名称关键词 */
  componentName: string
  sourceMode: RiskSourceMode | ''
  riskLevel: OpenSourceRiskComponentRiskLevel | ''
  /** 勾选后在列表中一并展示已忽略组件；默认不勾选 */
  showIgnored: boolean
}

/** 开源风险 · 组件清单查询参数 */
export interface OpenSourceRiskComponentQueryParams extends Partial<PageParams> {
  componentName?: string
  sourceMode?: RiskSourceMode
  riskLevel?: OpenSourceRiskComponentRiskLevel
  /** 为 true 时包含已忽略组件；缺省或 false 时不返回已忽略项 */
  includeIgnored?: boolean
}

/** 开源风险 · 漏洞处理状态 */
export type OpenSourceRiskVulnerabilityProcessingStatus =
  | 'pending'
  | 'needs_review'
  | 'verified'

/** 开源风险 · 漏洞风险清单项 */
export interface OpenSourceRiskVulnerability {
  vulnerabilityId: string
  cveId: string
  componentName: string
  version: string
  riskLevel: OpenSourceRiskComponentRiskLevel
  cvssScore: number
  processingStatus: OpenSourceRiskVulnerabilityProcessingStatus
  /** 识别来源：项目扫描 / 导入 SBOM */
  sourceMode: RiskSourceMode
}

/** 开源风险 · 漏洞风险筛选表单 */
export interface OpenSourceRiskVulnerabilityListFilters {
  cveId: string
  riskLevel: OpenSourceRiskComponentRiskLevel | ''
  componentName: string
  processingStatus: OpenSourceRiskVulnerabilityProcessingStatus | ''
}

/** 开源风险 · 漏洞风险查询参数 */
export interface OpenSourceRiskVulnerabilityQueryParams extends Partial<PageParams> {
  cveId?: string
  riskLevel?: OpenSourceRiskComponentRiskLevel
  componentName?: string
  processingStatus?: OpenSourceRiskVulnerabilityProcessingStatus
}
