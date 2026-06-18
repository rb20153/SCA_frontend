import type { PageParams } from '@/types/common'

export interface Policy {
  policyId: string
  policyName: string
  scenarioDescription: string
  referencedProjectCount: number
  isDefault: boolean
  updatedAt: string
}

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
