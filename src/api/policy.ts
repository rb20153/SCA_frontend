import {
  getMockPolicyRuleHitDetailSeed,
  getMockPolicyRuleHits,
} from '@/mock/modules/policy/ruleHitList'
import type { ApiResponse, PageParams, PageResult } from '@/types/common'
import type {
  Policy,
  PolicyDetectParams,
  PolicyEditorContent,
  PolicyGovernanceOverview,
  PolicyImportParams,
  PolicyQueryParams,
  PolicyRuleHitDetail,
  PolicyRuleHitListItem,
  PolicyRuleHitQueryParams,
  PolicyVersionListItem,
  PolicyVersionDiffExportResult,
  PolicyVersionDiffResult,
  SubmitPolicyPublishParams,
  SubmitPolicyPublishResult,
  SubmitPolicyVersionApprovalParams,
  SubmitPolicyVersionApprovalResult,
  ExportPolicyVersionParams,
  PolicyVersionExportResult,
  RollbackPolicyVersionParams,
} from '@/types/policy'
import { MOCK_ALL_POLICIES } from '@/mock/modules/policy/policyList'
import {
  getMockPolicyEditorConfigText,
  MOCK_NEW_POLICY_EDITOR_JSON,
} from '@/mock/modules/policy/policyEditorConfig'
import { getMockPolicyDetectParams } from '@/mock/modules/policy/policyDetectParams'
import {
  exportMockPolicyVersionDiffReport,
  getMockPolicyVersionDiff,
} from '@/mock/modules/policy/policyVersionDiff'
import {
  getMockPolicyCurrentVersion,
  getMockPolicyGovernanceOverview,
  getMockPolicyVersionPage,
  submitMockPolicyPublishApplication,
  submitMockPolicyVersionApproval,
  exportMockPolicyVersion,
  rollbackMockPolicyVersion,
} from '@/mock/modules/policy/policyVersionList'

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
 * 获取策略编辑器配置文本（新建返回默认模板，编辑返回当前生效版本）
 * @param policyId - 策略 ID；新建传 `new`
 */
export function getPolicyEditorContent(
  policyId: string,
): Promise<ApiResponse<PolicyEditorContent | null>> {
  const configText =
    policyId === 'new'
      ? MOCK_NEW_POLICY_EDITOR_JSON
      : getMockPolicyEditorConfigText(policyId)

  if (!configText) {
    // TODO: replace with → return request.get(`/api/policies/${policyId}/editor-content`)
    return Promise.resolve({ code: 200, message: 'ok', data: null })
  }

  const currentVersion =
    policyId === 'new' ? null : getMockPolicyCurrentVersion(policyId)

  // TODO: replace with → return request.get(`/api/policies/${policyId}/editor-content`)
  return Promise.resolve({
    code: 200,
    message: 'ok',
    data: {
      configText,
      currentVersion,
    },
  })
}

/**
 * 获取策略当前生效版本的检测参数（项目绑定默认值）
 * @param policyId - 策略 ID
 */
export function getPolicyDetectParams(
  policyId: string,
): Promise<ApiResponse<PolicyDetectParams | null>> {
  const data = getMockPolicyDetectParams(policyId)
  // TODO: replace with → return request.get(`/api/policies/${policyId}/detect-params`)
  return Promise.resolve({ code: 200, message: 'ok', data })
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
  return Promise.resolve({ code: 200, message: 'ok', data: policy   })
}

/**
 * 导入策略文件（JSON/YAML），后端异步校验
 * @param params - 文件、导入模式与导入前校验项
 */
export function importPolicy(params: PolicyImportParams): Promise<ApiResponse<null>> {
  void params.file.name
  // TODO: replace with → FormData + request.post('/api/policies/import', formData)
  return Promise.resolve({ code: 200, message: 'ok', data: null })
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

/**
 * 获取策略版本与审批页概览统计
 * @param policyId - 策略 ID
 */
export function getPolicyGovernanceOverview(
  policyId: string,
): Promise<ApiResponse<PolicyGovernanceOverview | null>> {
  const data = getMockPolicyGovernanceOverview(policyId)
  // TODO: replace with → return request.get(`/api/policies/${policyId}/governance/overview`)
  return Promise.resolve({ code: 200, message: 'ok', data })
}

/**
 * 获取策略版本列表（分页）
 * @param policyId - 策略 ID
 * @param params - 分页参数
 */
export function getPolicyVersionList(
  policyId: string,
  params: PageParams,
): Promise<ApiResponse<PageResult<PolicyVersionListItem>>> {
  const data = getMockPolicyVersionPage(policyId, params)
  // TODO: replace with → return request.get(`/api/policies/${policyId}/versions`, { params })
  return Promise.resolve({ code: 200, message: 'ok', data })
}

/**
 * 提交策略发布申请（携带配置与编辑人 ID）
 * @param params - 版本号、变更摘要、配置文本与 editorId
 */
export async function submitPolicyPublishApplication(
  params: SubmitPolicyPublishParams,
): Promise<ApiResponse<SubmitPolicyPublishResult>> {
  try {
    const data = submitMockPolicyPublishApplication(params)
    // TODO: replace with → return request.post(`/api/policies/${params.policyId}/publish-requests`, params)
    return { code: 200, message: 'ok', data }
  } catch (error) {
    const messageText = error instanceof Error ? error.message : '提交失败'
    return Promise.reject(new Error(messageText))
  }
}

/**
 * 获取策略版本差异对比（左右版本摘要由后端按行状态解析）
 * @param policyId - 策略 ID
 * @param anchorVersionId - 当前点击的版本行 ID
 */
export function getPolicyVersionDiff(
  policyId: string,
  anchorVersionId: string,
): Promise<ApiResponse<PolicyVersionDiffResult | null>> {
  const data = getMockPolicyVersionDiff(policyId, anchorVersionId)
  // TODO: replace with → return request.get(`/api/policies/${policyId}/versions/${anchorVersionId}/diff`)
  return Promise.resolve({ code: 200, message: 'ok', data })
}

/**
 * 导出策略版本差异报告
 * @param policyId - 策略 ID
 * @param anchorVersionId - 当前点击的版本行 ID
 */
export function exportPolicyVersionDiffReport(
  policyId: string,
  anchorVersionId: string,
): Promise<ApiResponse<PolicyVersionDiffExportResult | null>> {
  const data = exportMockPolicyVersionDiffReport(policyId, anchorVersionId)
  if (!data) {
    // TODO: replace with → return request.post(`/api/policies/${policyId}/versions/${anchorVersionId}/diff/export`)
    return Promise.resolve({ code: 200, message: 'ok', data: null })
  }
  // TODO: replace with → return request.post(`/api/policies/${policyId}/versions/${anchorVersionId}/diff/export`)
  return Promise.resolve({ code: 200, message: 'ok', data })
}

/**
 * 提交策略版本发布审批
 * @param params - 审批结论、意见与生效时间
 */
export async function submitPolicyVersionApproval(
  params: SubmitPolicyVersionApprovalParams,
): Promise<ApiResponse<SubmitPolicyVersionApprovalResult>> {
  try {
    const data = submitMockPolicyVersionApproval(params)
    // TODO: replace with → return request.post(`/api/policies/${params.policyId}/versions/${params.versionId}/approval`, params)
    return { code: 200, message: 'ok', data }
  } catch (error) {
    const messageText = error instanceof Error ? error.message : '审批提交失败'
    return Promise.reject(new Error(messageText))
  }
}

/**
 * 导出策略版本文件
 * @param params - 版本 ID、导出范围与格式
 */
export function exportPolicyVersion(
  params: ExportPolicyVersionParams,
): Promise<ApiResponse<PolicyVersionExportResult>> {
  try {
    const data = exportMockPolicyVersion(params)
    // TODO: replace with → return request.post(`/api/policies/${params.policyId}/versions/${params.versionId}/export`, params)
    return Promise.resolve({ code: 200, message: 'ok', data })
  } catch (error) {
    const messageText = error instanceof Error ? error.message : '导出失败'
    return Promise.reject(new Error(messageText))
  }
}

/**
 * 回滚策略历史版本为当前生效版本
 * @param params - 目标版本 ID 与确认版本号
 */
export async function rollbackPolicyVersion(
  params: RollbackPolicyVersionParams,
): Promise<ApiResponse<null>> {
  try {
    rollbackMockPolicyVersion(params)
    // TODO: replace with → return request.post(`/api/policies/${params.policyId}/versions/${params.versionId}/rollback`, params)
    return { code: 200, message: 'ok', data: null }
  } catch (error) {
    const messageText = error instanceof Error ? error.message : '回滚失败'
    return Promise.reject(new Error(messageText))
  }
}
