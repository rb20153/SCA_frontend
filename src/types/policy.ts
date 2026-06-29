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
