import type { PolicyRuleHitListFilters, PolicyRuleHitQueryParams } from '@/types/policy'

/** 命中范围筛选项 */
export const POLICY_RULE_HIT_SCOPE_FILTER_OPTIONS: {
  value: PolicyRuleHitListFilters['hitScope']
  label: string
}[] = [
  { value: '', label: '全部范围' },
  { value: 'source', label: '源码' },
  { value: 'binary', label: '二进制' },
  { value: 'report-export', label: '报告导出' },
]

/** 返回空的规则命中筛选表单 */
export function createEmptyPolicyRuleHitListFilters(): PolicyRuleHitListFilters {
  return {
    ruleKeyword: '',
    hitScope: '',
    traceId: '',
  }
}

/** 将表单筛选条件转为 API 查询参数（空值不传） */
export function policyRuleHitListFiltersToQuery(
  filters: PolicyRuleHitListFilters,
): Omit<PolicyRuleHitQueryParams, 'page' | 'pageSize' | 'policyId'> {
  const query: Omit<PolicyRuleHitQueryParams, 'page' | 'pageSize' | 'policyId'> = {}
  const ruleKeyword = filters.ruleKeyword.trim()
  const traceId = filters.traceId.trim()

  if (ruleKeyword) query.ruleKeyword = ruleKeyword
  if (filters.hitScope) query.hitScope = filters.hitScope
  if (traceId) query.traceId = traceId

  return query
}
