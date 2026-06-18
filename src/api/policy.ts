import type { ApiResponse, PageResult } from '@/types/common'
import type {
  Policy,
  PolicyQueryParams,
  PolicyRuleHitDetail,
  PolicyRuleHitListItem,
  PolicyRuleHitQueryParams,
} from '@/types/policy'
import { MOCK_ALL_POLICIES } from '@/mock/modules/policy/policyList'
import {
  getMockPolicyRuleHitDetailSeed,
  getMockPolicyRuleHits,
} from '@/mock/modules/policy/ruleHitList'

// TODO: replace with: import request from '@/utils/request'

const DEFAULT_PAGE_SIZE = 10

/** mock 阶段按筛选条件过滤策略列表 */
function filterMockPolicies(params: PolicyQueryParams): Policy[] {
  let list = [...MOCK_ALL_POLICIES]

  const policyName = params.policyName?.trim()
  if (policyName) {
    list = list.filter((item) => item.policyName.includes(policyName))
  }

  const scenario = params.scenario?.trim()
  if (scenario) {
    list = list.filter((item) => item.scenarioDescription.includes(scenario))
  }

  return list.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
}

/**
 * 获取策略列表（分页 + 筛选）
 * @param params - 分页与筛选参数
 */
export function getPolicyList(
  params: PolicyQueryParams,
): Promise<ApiResponse<PageResult<Policy>>> {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE

  const sorted = filterMockPolicies(params)
  const start = (page - 1) * pageSize
  const list = sorted.slice(start, start + pageSize)

  return Promise.resolve({
    code: 200,
    message: 'ok',
    data: {
      list,
      total: sorted.length,
      page,
      pageSize,
    },
  })
}

/**
 * 获取策略下拉选项（创建项目绑定策略等）
 */
export function getPolicySelectOptions(): Promise<ApiResponse<Policy[]>> {
  // TODO: replace with → return request.get('/api/policies/options')
  return Promise.resolve({
    code: 200,
    message: 'ok',
    data: [...MOCK_ALL_POLICIES].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    ),
  })
}

/**
 * 删除策略
 * @param policyId - 要删除的策略 ID
 */
export function deletePolicy(policyId: string): Promise<ApiResponse<null>> {
  const index = MOCK_ALL_POLICIES.findIndex((item) => item.policyId === policyId)
  if (index >= 0) {
    MOCK_ALL_POLICIES.splice(index, 1)
  }

  // TODO: replace with → return request.delete(`/api/policies/${policyId}`)
  return Promise.resolve({ code: 200, message: 'ok', data: null })
}

/**
 * 按 ID 获取策略摘要（刷新后兜底策略名）
 * @param policyId - 策略 ID
 */
export function getPolicyById(policyId: string): Promise<ApiResponse<Policy | null>> {
  const policy = MOCK_ALL_POLICIES.find((item) => item.policyId === policyId) ?? null
  // TODO: replace with → return request.get(`/api/policies/${policyId}`)
  return Promise.resolve({ code: 200, message: 'ok', data: policy })
}

/** mock 阶段按筛选条件过滤规则命中列表 */
function filterMockPolicyRuleHits(
  policyId: string,
  params: PolicyRuleHitQueryParams,
): PolicyRuleHitListItem[] {
  let list = [...getMockPolicyRuleHits(policyId)]

  const ruleKeyword = params.ruleKeyword?.trim()
  if (ruleKeyword) {
    list = list.filter((item) => item.ruleKeyword.includes(ruleKeyword))
  }

  if (params.hitScope) {
    list = list.filter((item) => item.hitScope === params.hitScope)
  }

  const traceId = params.traceId?.trim()
  if (traceId) {
    list = list.filter((item) => item.traceId.includes(traceId))
  }

  return list.sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  )
}

/**
 * 获取策略规则命中追溯列表（分页 + 筛选）
 * @param params - 策略 ID、分页与筛选参数
 */
export function getPolicyRuleHitList(
  params: PolicyRuleHitQueryParams,
): Promise<ApiResponse<PageResult<PolicyRuleHitListItem>>> {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE

  const sorted = filterMockPolicyRuleHits(params.policyId, params)
  const start = (page - 1) * pageSize
  const list = sorted.slice(start, start + pageSize)

  // TODO: replace with → return request.get(`/api/policies/${params.policyId}/rule-hits`, { params })
  return Promise.resolve({
    code: 200,
    message: 'ok',
    data: {
      list,
      total: sorted.length,
      page,
      pageSize,
    },
  })
}

/**
 * 获取单条规则命中追溯详情
 * @param hitId - 命中记录 ID
 */
export function getPolicyRuleHitDetail(
  hitId: string,
): Promise<ApiResponse<PolicyRuleHitDetail | null>> {
  const policyId = hitId.replace(/-hit-\d+$/, '')
  const item = getMockPolicyRuleHits(policyId).find((row) => row.hitId === hitId)
  const seed = getMockPolicyRuleHitDetailSeed(hitId)

  if (!item || !seed) {
    // TODO: replace with → return request.get(`/api/policies/rule-hits/${hitId}`)
    return Promise.resolve({ code: 200, message: 'ok', data: null })
  }

  // TODO: replace with → return request.get(`/api/policies/rule-hits/${hitId}`)
  return Promise.resolve({
    code: 200,
    message: 'ok',
    data: {
      ...item,
      hitSnippet: seed.hitSnippet,
      processingResult: seed.processingResult,
    },
  })
}
