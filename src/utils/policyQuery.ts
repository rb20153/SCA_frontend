import type { PolicyListFilters, PolicyQueryParams } from '@/types/policy'

/** 返回空的策略列表筛选表单 */
export function createEmptyPolicyListFilters(): PolicyListFilters {
  return {
    policyName: '',
    scenario: '',
  }
}

/** 将表单筛选条件转为 API 查询参数（空值不传） */
export function policyListFiltersToQuery(
  filters: PolicyListFilters,
): Omit<PolicyQueryParams, 'page' | 'pageSize'> {
  const query: Omit<PolicyQueryParams, 'page' | 'pageSize'> = {}
  const policyName = filters.policyName.trim()
  const scenario = filters.scenario.trim()

  if (policyName) query.policyName = policyName
  if (scenario) query.scenario = scenario

  return query
}
