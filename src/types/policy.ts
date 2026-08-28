import type { PageParams } from '@/types/common'

export interface Policy {
  policyId: string
  policyName: string
  scenarioDescription: string
  referencedProjectCount: number
  isDefault: boolean
  updatedAt: string
}

/** 策略当前生效版本的检测参数（项目绑定时的默认值来源） */
export interface PolicyDetectParams {
  /** 相似度阈值 0–100 */
  similarityThreshold: number
  /** 最小匹配长度 */
  minMatchLength: number
  /** 排除目录列表 */
  excludeDirectories: string[]
}

/** 策略编辑器 JSON 配置结构（与右侧编辑器、左侧解析预览共用） */
export interface PolicyEditorConfig {
  name: string
  similarity_threshold: number
  min_match_len: number
  excluded_folders: string[]
  retry: {
    enabled: boolean
    count: number
  }
  output_format: 'json' | 'yaml'
}

/** 策略配置解析成功结果 */
export interface PolicyConfigParseSuccess {
  ok: true
  config: PolicyEditorConfig
}

/** 策略配置解析失败结果 */
export interface PolicyConfigParseFailure {
  ok: false
  errorType: 'syntax' | 'schema'
  title: string
  message: string
  hints: string[]
}

export type PolicyConfigParseResult = PolicyConfigParseSuccess | PolicyConfigParseFailure

export interface PolicyListFilters {
  policyName: string
  scenario: string
}

export interface PolicyQueryParams extends PageParams {
  policyName?: string
  scenario?: string
}

/** 规则命中范围 */
export type PolicyRuleHitScope = 'source' | 'binary' | 'report-export'

/** 脱敏动作 */
export type PolicyMaskingAction = 'replace' | 'summary-only' | 'block' | 'watermark'

/** 规则命中追溯列表项 */
export interface PolicyRuleHitListItem {
  hitId: string
  policyId: string
  occurredAt: string
  ruleKeyword: string
  hitObject: string
  maskingAction: PolicyMaskingAction
  responsibleUser: string
  traceId: string
  hitScope: PolicyRuleHitScope
}

/** 规则命中追溯详情 */
export interface PolicyRuleHitDetail extends PolicyRuleHitListItem {
  hitSnippet: string
  processingResult: string
  suggestion: string
  tamperAnalysis: string
  taskName: string
  projectName: string
}

export interface PolicyRuleHitListFilters {
  ruleKeyword: string
  hitScope: '' | PolicyRuleHitScope
  traceId: string
}

export interface PolicyRuleHitQueryParams extends PageParams {
  policyId: string
  ruleKeyword?: string
  hitScope?: PolicyRuleHitScope
  traceId?: string
}

/** 策略入口方式：编辑器 / 导入 */
export type PolicyEntryType = 'editor' | 'import'

/** 策略导入模式 */
export type PolicyImportMode = 'create' | 'overwrite' | 'new-version'

/** 策略导入前校验项 */
export type PolicyImportPrecheck = 'dedup' | 'compatibility' | 'risk'

/** 策略文件导入请求参数 */
export interface PolicyImportParams {
  file: File
  importMode: PolicyImportMode
  prechecks: PolicyImportPrecheck[]
  /** 编辑已有策略时传入，用于覆盖或新版本 */
  policyId?: string
}

/** 策略版本状态 */
export type PolicyVersionStatus = 'published' | 'pending' | 'history'

/** 策略版本列表项 */
export interface PolicyVersionListItem {
  versionId: string
  policyId: string
  versionNo: string
  status: PolicyVersionStatus
  creatorId: string
  creatorName: string
  createdAt: string
  changeSummary: string
}

/** 策略版本与审批页概览 */
export interface PolicyGovernanceOverview {
  policyId: string
  policyName: string
  currentVersion: string
  pendingCount: number
  lastChangedAt: string
}

/** 策略编辑器加载内容（配置文本 + 当前生效版本） */
export interface PolicyEditorContent {
  configText: string
  /** 新建策略时为 null */
  currentVersion: string | null
}

/** 提交策略发布申请参数 */
export interface SubmitPolicyPublishParams {
  /** 新建传 `new` */
  policyId: string
  versionNo: string
  changeSummary: string
  /** JSON 配置全文 */
  configText: string
  /** 当前编辑人 userId */
  editorId: string
}

/** 提交策略发布申请响应 */
export interface SubmitPolicyPublishResult {
  policyId: string
  versionId: string
  versionNo: string
}

/** 策略版本差异对比一侧摘要 */
export interface PolicyVersionDiffSide {
  versionId: string
  versionNo: string
  status: PolicyVersionStatus
  configSummary: string
}

/** 策略版本差异对比结果 */
export interface PolicyVersionDiffResult {
  policyId: string
  policyName: string
  anchorVersionId: string
  leftVersionId: string
  rightVersionId: string
  left: PolicyVersionDiffSide
  right: PolicyVersionDiffSide
}

/** 策略版本差异报告导出结果 */
export interface PolicyVersionDiffExportResult {
  downloadUrl: string
  fileName: string
}

/** 策略版本审批结论 */
export type PolicyVersionApprovalConclusion = 'approved' | 'rejected'

/** 策略版本审批生效时间 */
export type PolicyVersionEffectiveTime = 'immediate' | 'next-window'

/** 提交策略版本审批参数 */
export interface SubmitPolicyVersionApprovalParams {
  policyId: string
  versionId: string
  conclusion: PolicyVersionApprovalConclusion
  opinion: string
  effectiveTime: PolicyVersionEffectiveTime
}

/** 提交策略版本审批响应 */
export interface SubmitPolicyVersionApprovalResult {
  versionId: string
  conclusion: PolicyVersionApprovalConclusion
  effectiveTime: PolicyVersionEffectiveTime
}

/** 策略版本导出范围 */
export type PolicyVersionExportScope = 'params-and-rules' | 'params-only' | 'rules-only'

/** 策略版本导出格式 */
export type PolicyVersionExportFormat = 'json' | 'yaml'

/** 导出策略版本参数 */
export interface ExportPolicyVersionParams {
  policyId: string
  versionId: string
  scope: PolicyVersionExportScope
  format: PolicyVersionExportFormat
}

/** 策略版本导出结果 */
export interface PolicyVersionExportResult {
  downloadUrl: string
  fileName: string
}

/** 回滚策略版本参数 */
export interface RollbackPolicyVersionParams {
  policyId: string
  versionId: string
  /** 用户输入的版本号，须与目标历史版本一致 */
  confirmVersionNo: string
}
