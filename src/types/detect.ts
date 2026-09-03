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
  CodeDiffLine,
} from './common'
import type { RepoAuthType, SourceIngestMode } from './sourceIngest'
import type { FileTreeNode } from './fileTree'

export interface DetectTask {
  taskId: string
  /** 关联审计日志 TraceID */
  traceId?: string
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
  taskId?: string
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

/** 自主率检测结果 · 顶部总体摘要（页面跳转后按 taskId 拉取） */
export interface AutonomyDetectResultOverview {
  taskId: string
  taskName: string
  projectName: string
  status: TaskStatus
  /** 完成时间 ISO；未完成时为 null */
  finishedAt: string | null
  /** 总体自主率 0–100 */
  totalAutonomyRate: number
  /** 风险自主率 0–100 */
  riskAutonomyRate: number
  /** 问题文件数 */
  issueFileCount: number
  /** 代码问题数 */
  codeIssueCount: number
  /** 指纹问题数 */
  fingerprintIssueCount: number
  /** 许可证取证摘要；旧任务可能为 null */
  licenseSummary: AutonomyLicenseSummary | null
}

export type AutonomyLicenseProvenanceStatus =
  | 'completed'
  | 'partial'
  | 'unavailable'
  | 'disabled'
  | 'legacy-unavailable'
  | 'pending'

export interface AutonomyLicenseSummary {
  projectLicenseIds: string[]
  sourceLicenseIds: string[]
  projectDeclaredCount: number | null
  matchedSourceCount: number | null
  unknownProjectSourceCount: number | null
  unknownMatchedSourceCount: number | null
  complete: boolean
  provenanceStatus: AutonomyLicenseProvenanceStatus | null
}

export interface AutonomyLicenseEvidence {
  startLine: number | null
  endLine: number | null
  contentSha256: string
  excerpt: string
  jsonPointer: string | null
  contentAvailable: boolean
}

export interface AutonomyProjectDeclaredLicense {
  artifactId: string
  filePath: string
  licenseId: string
  evidence: AutonomyLicenseEvidence | null
  dependencyDepth: number | null
  dependencyScope: string
}

export interface AutonomyMatchedLicenseSource {
  repoId: string
  sourceFile: string
  licenseId: string
  reviewStatus: string
}

export interface AutonomyLicenseArtifact {
  artifactId: string
  filePath: string
  status: string
  limitationReason: string
  associationStatus: string
  scopeSummary: string
}

export interface AutonomyLicenseResult {
  taskId: string
  projectId: string
  taskStatus: string
  provenanceStatus: AutonomyLicenseProvenanceStatus
  projectDeclared: AutonomyProjectDeclaredLicense[]
  matchedSources: AutonomyMatchedLicenseSource[]
  summary: AutonomyLicenseSummary
  artifacts: AutonomyLicenseArtifact[]
  licenseTextIsCopyEvidence: false
}

/** 自主率检测结果 · 文件详情摘要（右侧详情区顶部） */
export interface AutonomyFileDetailSummary {
  fileId: string
  fileName: string
  /** 展示用类型，如「文本文件」 */
  fileTypeLabel: string
  /** 问题行区间描述，如 120-132，54-58 */
  issueLineRanges: string
  /** 整体问题率 0–100 */
  overallIssueRate: number
  sourceProject: string
  /** 来源仓库链接（可点击跳转） */
  sourceUrl: string
  sourceVersion: string
  /** 最高置信度 0–1 */
  maxConfidence: number
}

/** 代码检测告警类型（后端枚举） */
export type AutonomyCodeAlertType = 'high-similarity' | 'fragment-reassembly'

/** 指纹检测告警类型（后端枚举） */
export type AutonomyFingerprintAlertType = 'fingerprint-hit' | 'fingerprint-sequence' | 'segment-fingerprint'

/** 代码 diff 单侧代码块（当前文件 / 疑似来源） */
export interface AutonomyCodeDiffPane {
  /** 居中标题，如「当前被检测代码 · solver.cpp L128-132」 */
  paneTitle: string
  lines: CodeDiffLine[]
}

/** 代码检测证据条目 */
export interface AutonomyCodeEvidenceItem {
  evidenceId: string
  alertType: AutonomyCodeAlertType
  confidence: number
  sourceProject: string
  /** 来源仓库链接，有值时来源项目可点击跳转 */
  sourceUrl: string
  sourceVersion: string
  /** 命中来源的许可证，如 GPL-3.0-only */
  license: string
  /** 解析摘要（篡改/相似度分析） */
  tamperAnalysis: string
  /** 处置建议 */
  suggestion: string
  currentCode: AutonomyCodeDiffPane
  suspectedCode: AutonomyCodeDiffPane
}

/** 指纹检测证据条目 */
export interface AutonomyFingerprintEvidenceItem {
  evidenceId: string
  alertType: AutonomyFingerprintAlertType
  confidence: number
  sourceProject: string
  sourceVersion: string
  /** 命中说明（一段文字描述） */
  description: string
}

/** 自主率检测结果 · 单文件详情（证据一次性全量返回，前端分页展示） */
export interface AutonomyFileDetail {
  summary: AutonomyFileDetailSummary
  codeEvidences: AutonomyCodeEvidenceItem[]
  fingerprintEvidences: AutonomyFingerprintEvidenceItem[]
}

/** 自主率检测结果 · 来源汇总风险等级（许可证/来源风险） */
export type AutonomySourceHitRiskLevel = 'high' | 'medium' | 'low'

/** 自主率检测结果 · 来源汇总列表项 */
export interface AutonomySourceHitItem {
  hitId: string
  kbProjectId: string
  /** 来源知识库项目名称 */
  kbProjectName: string
  kbVersion: string
  /** 命中被测文件路径（表格「命中文件」列直接展示） */
  filePath: string
  /** 命中被测文件名称列表（定位时按 filePath → 列表顺序尝试） */
  hitFileNames: string[]
  license: string
  riskLevel: AutonomySourceHitRiskLevel
}

/** 自主率检测结果 · 来源汇总筛选表单 */
export interface AutonomySourceHitListFilters {
  kbProjectName: string
  riskLevel: AutonomySourceHitRiskLevel | ''
}

/** 自主率检测结果 · 来源汇总查询参数 */
export interface AutonomySourceHitQueryParams extends Partial<PageParams> {
  kbProjectName?: string
  riskLevel?: AutonomySourceHitRiskLevel
}

/** 自主率检测结果 Tab key */
export type AutonomyDetectResultTabKey = 'evidence' | 'sources' | 'licenses'

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

/** 开源风险 · 依赖图节点风险等级（含无风险，根节点用 none） */
export type RiskComponentGraphRiskLevel = OpenSourceRiskComponentRiskLevel | 'none'

/** 开源风险 · 组件依赖图节点（领域数据，非 G6 原生结构） */
export interface RiskComponentGraphNode {
  /** 节点 ID；组件节点复用 componentId，便于点击直接打开详情抽屉 */
  id: string
  /** 组件名（根节点为被测项目名） */
  componentName: string
  /** 版本号；根节点为空串 */
  version: string
  /** 是否为根节点（被测项目本身） */
  isRoot: boolean
  riskLevel: RiskComponentGraphRiskLevel
  /** 关联漏洞数，用于 tooltip 与节点标注 */
  vulnerabilityCount: number
  /** 依赖深度：0=根，1=直接依赖，≥2=间接（传递）依赖 */
  depth: number
}

/** 开源风险 · 组件依赖图边（source 依赖 target） */
export interface RiskComponentGraphEdge {
  source: string
  target: string
}

/** 开源风险 · 组件依赖关系图数据（节点 + 边） */
export interface RiskComponentGraph {
  nodes: RiskComponentGraphNode[]
  edges: RiskComponentGraphEdge[]
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

/** 开源风险 · 漏洞处置方式 */
export const OPEN_SOURCE_RISK_VULNERABILITY_DISPOSITION = {
  UpgradeVersion: 'upgrade-version',
  TempIsolate: 'temp-isolate',
  AcceptRisk: 'accept-risk',
  FalsePositiveIgnore: 'false-positive-ignore',
} as const

export type OpenSourceRiskVulnerabilityDispositionMethod =
  (typeof OPEN_SOURCE_RISK_VULNERABILITY_DISPOSITION)[keyof typeof OPEN_SOURCE_RISK_VULNERABILITY_DISPOSITION]

/** 开源风险 · 漏洞处置复核结论 */
export const OPEN_SOURCE_RISK_VULNERABILITY_REVIEW_CONCLUSION = {
  Approved: 'approved',
  Rejected: 'rejected',
} as const

export type OpenSourceRiskVulnerabilityReviewConclusion =
  (typeof OPEN_SOURCE_RISK_VULNERABILITY_REVIEW_CONCLUSION)[keyof typeof OPEN_SOURCE_RISK_VULNERABILITY_REVIEW_CONCLUSION]

/** 开源风险 · 漏洞处置登记信息 */
export interface OpenSourceRiskVulnerabilityRegistration {
  method: OpenSourceRiskVulnerabilityDispositionMethod
  assigneeName: string
  plannedCompleteDate: string
  description: string
  registeredBy: string
  registeredAt: string
}

/** 开源风险 · 漏洞处置验证结果（已验证） */
export interface OpenSourceRiskVulnerabilityVerificationResult {
  finalMethod: OpenSourceRiskVulnerabilityDispositionMethod
  verifierName: string
  verifiedAt: string
  resultDescription: string
}

/** 开源风险 · 漏洞处置时间线条目 */
export interface OpenSourceRiskVulnerabilityTimelineItem {
  time: string
  message: string
}

/** 开源风险 · 漏洞详情（抽屉） */
export interface OpenSourceRiskVulnerabilityDetail {
  vulnerabilityId: string
  cveId: string
  componentName: string
  version: string
  riskLevel: OpenSourceRiskComponentRiskLevel
  cvssScore: number
  processingStatus: OpenSourceRiskVulnerabilityProcessingStatus
  affectedComponents: string[]
  fixSuggestion: string
  /** 待处理时已登记但未复核的方案；通常为 null */
  registration: OpenSourceRiskVulnerabilityRegistration | null
  /** 需复核时的待审方案 */
  pendingReviewPlan: OpenSourceRiskVulnerabilityRegistration | null
  verificationResult: OpenSourceRiskVulnerabilityVerificationResult | null
  dispositionTimeline: OpenSourceRiskVulnerabilityTimelineItem[]
}

/** 登记漏洞处置请求体 */
export interface RegisterOpenSourceRiskVulnerabilityDispositionParams {
  method: OpenSourceRiskVulnerabilityDispositionMethod
  plannedCompleteDate: string
  assigneeUserId: string
  assigneeName: string
  description: string
}

/** 复核漏洞处置请求体 */
export interface ReviewOpenSourceRiskVulnerabilityDispositionParams {
  conclusion: OpenSourceRiskVulnerabilityReviewConclusion
  opinion: string
}

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

/** 开源风险 · SBOM 标准格式 */
export type OpenSourceRiskSbomStandardFormat = 'spdx' | 'cyclonedx'

/** 开源风险 · SBOM 文件格式 */
export type OpenSourceRiskSbomFileFormat = 'json' | 'xml'

/** 开源风险 · SBOM 输出粒度 */
export type OpenSourceRiskSbomGranularity = 'project' | 'module' | 'package'

/** 开源风险 · SBOM 清单预览（项目级行） */
export interface OpenSourceRiskSbomProjectPreviewRow {
  rowId: string
  componentName: string
  version: string
  license: string
  supplier: string
  referenceMode: string
  riskLevel: OpenSourceRiskComponentRiskLevel
}

/** 开源风险 · SBOM 清单预览（模块级行） */
export interface OpenSourceRiskSbomModulePreviewRow {
  rowId: string
  moduleName: string
  componentCount: number
  highRiskLicense: string
  vulnerableComponentCount: number
}

/** 开源风险 · SBOM 清单预览（包级行） */
export interface OpenSourceRiskSbomPackagePreviewRow {
  rowId: string
  packageLabel: string
  evidenceSource: string
  confidence: number
  conflictHint: 'none' | 'conflict'
  remediationSuggestion: string
}

/** 开源风险 · SBOM 预览查询参数 */
export interface OpenSourceRiskSbomPreviewQueryParams extends Partial<PageParams> {
  granularity: OpenSourceRiskSbomGranularity
}

/** 导出 SBOM 请求体 */
export interface ExportOpenSourceRiskSbomParams {
  standardFormat: OpenSourceRiskSbomStandardFormat
  fileFormat: OpenSourceRiskSbomFileFormat
  granularity: OpenSourceRiskSbomGranularity
}

/** 导出 SBOM 响应 */
export interface ExportOpenSourceRiskSbomResult {
  downloadUrl: string
  fileName: string
}

/** AI 解析 · 任务状态 */
export type AiParseTaskStatus = 'running' | 'failed' | 'success'

export type AiParseAnalysisMode = 'pending' | 'ai_provider' | 'rule_fallback'

/** AI 解析 · 扫描深度（依赖层数） */
export type AiParseScanDepth = 1 | 2 | 3

/** AI 解析 · 规则回退原因 */
export type AiParseFallbackReason = 'incomplete-license' | 'ai-unavailable' | 'low-confidence'

/** AI 解析 · 历史任务项 */
export interface AiParseTask {
  parseTaskId: string
  /** 解析对象展示名（仓库名或压缩包文件名） */
  parseObjectName: string
  projectId: string
  projectName: string
  /** 创建/提交时间 ISO 8601 */
  createdAt: string
  /** 来源方式：三方仓库拉取 / 上传压缩包 */
  sourceMode: SourceIngestMode
  status: AiParseTaskStatus
  scanDepth: AiParseScanDepth
  /** 已完成时的结果摘要 */
  resultSummary: string | null
  /** 已完成时的冲突数 */
  conflictCount: number | null
  analysisMode: AiParseAnalysisMode
  confidence: number
  elapsedMs: number
  fallbackUsed: boolean
}

/** AI 解析 · 解析结果详情（抽屉打开时拉取） */
export interface AiParseResultDetail {
  parseTaskId: string
  parseObjectName: string
  scanDepth: AiParseScanDepth
  /** 完成时间 ISO 8601 */
  finishedAt: string
  /** AI 解析覆盖率 0–100 */
  aiParseCoverage: number
  analysisMode: AiParseAnalysisMode
  aiStatus: string
  confidence: number
  confidenceThreshold: number
  elapsedMs: number
  fallbackUsed: boolean
  fallbackReason: string
  /** License 树节点（含 licenseLabel / licenseTagColor） */
  licenseTreeNodes: FileTreeNode[]
  /** 潜在许可证冲突说明列表 */
  licenseConflicts: string[]
  /** 后端持久化的完整 Markdown 报告 */
  reportMarkdown: string
  /** 每条许可证来源的文件取证 */
  licenseSources: AiParseLicenseSource[]
  provenanceVersion: number | null
  provenanceStatus: 'recorded' | 'legacy-unavailable' | null
  evidenceCollection: AiParseEvidenceCollection | null
  status: 'queued' | 'running' | 'completed' | 'failed' | null
}

export interface AiParseLicenseSource {
  id: string
  licenseId: string
  filePath: string
  sourceType: string
  acquisitionType: string
  repository: { name: string; url: string | null; version: string }
  component: { id: string; name: string; version: string; purl: string }
  dependencyDepth: number | null
  dependencyScope: string
  dependencyPath: string[]
  packageRootPath: string
  resolutionBasis: string
  extractionMethod: string
  evidence: AutonomyLicenseEvidence
}

export interface AiParseEvidenceCollection {
  dependenciesWithoutSourceFiles: string[]
  excludedByDepth: string[]
  unknownDependencyLevels: string[]
  unsupportedManifests: string[]
}

/** AI 解析 · 规则回退对比行 */
export interface AiParseFallbackCompareItem {
  targetPath: string
  aiResult: string
  ruleResult: string
}

/** 创建 AI 解析任务参数 */
export interface CreateAiParseTaskParams {
  projectId: string
  scanDepth: AiParseScanDepth
  sourceMode: SourceIngestMode
  repositoryUrl?: string
  authType?: RepoAuthType
  accessToken?: string
  username?: string
  password?: string
  sshPrivateKey?: string
  sshPassphrase?: string
  /** 上传模式下的压缩包（multipart 联调时使用） */
  packageFile?: File
  /** 上传模式下的压缩包文件名 */
  packageFileName?: string
}

/** 提交 AI 解析规则回退参数 */
export interface SubmitAiParseFallbackParams {
  reason: AiParseFallbackReason
}

/** AI 解析 · 列表筛选表单 */
export interface AiParseTaskListFilters {
  sourceMode: SourceIngestMode | ''
  status: AiParseTaskStatus | ''
}

/** AI 解析 · 列表查询参数 */
export interface AiParseTaskQueryParams extends Partial<PageParams> {
  sourceMode?: SourceIngestMode
  status?: AiParseTaskStatus
}
