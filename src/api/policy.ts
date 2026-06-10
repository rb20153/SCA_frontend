import type { ApiResponse, PageResult } from '@/types/common'
import type { Policy, PolicyQueryParams } from '@/types/policy'
import { MOCK_ALL_POLICIES } from '@/mock/modules/policy/policyList'

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
