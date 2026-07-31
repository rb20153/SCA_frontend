import request from '@/utils/request'
import type { ApiResponse, PageParams, PageResult } from '@/types/common'
import { buildImportPolicyFormData } from '@/utils/formDataBuilders'
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
import {
  exportPolicyVersionParamsToApi,
  normalizePolicyDetail,
  normalizePolicyDetectParams,
  normalizePolicyEditorContent,
  normalizePolicyGovernanceOverview,
  normalizePolicyList,
  normalizePolicyPage,
  normalizePolicyRuleHitDetail,
  normalizePolicyRuleHitPage,
  normalizePolicyVersionDiffExport,
  normalizePolicyVersionDiffResult,
  normalizePolicyVersionExport,
  normalizePolicyVersionPage,
  normalizeSubmitPolicyPublishResult,
  normalizeSubmitPolicyVersionApprovalResult,
  rollbackPolicyVersionParamsToApi,
  submitPolicyPublishParamsToApi,
  submitPolicyVersionApprovalParamsToApi,
} from '@/utils/policyAdapter'

/** multipart 请求头：显式声明后 axios 才会保留 FormData（默认 JSON 头会被序列化） */
const MULTIPART_CONFIG = { headers: { 'Content-Type': 'multipart/form-data' } }

/**
 * 获取策略列表（分页 + 筛选）
 * @param params - 分页与筛选参数，空值由调用方过滤后不下发
 */
export async function getPolicyList(
  params: PolicyQueryParams,
): Promise<ApiResponse<PageResult<Policy>>> {
  const res = await request.get<ApiResponse<unknown>>('/api/policies', { params })
  return { ...res, data: normalizePolicyPage(res.data) }
}

/**
 * 获取策略下拉选项（创建项目绑定策略等）
 */
export async function getPolicySelectOptions(): Promise<ApiResponse<Policy[]>> {
  const res = await request.get<ApiResponse<unknown>>('/api/policies/options')
  return { ...res, data: normalizePolicyList(res.data) }
}

/**
 * 获取策略编辑器配置文本（新建返回默认模板，编辑返回当前生效版本）
 * @param policyId - 策略 ID；新建传 `new`
 * @returns 配置文本与当前生效版本；后端未返回配置时为 null
 */
export async function getPolicyEditorContent(
  policyId: string,
): Promise<ApiResponse<PolicyEditorContent | null>> {
  const res = await request.get<ApiResponse<unknown>>(
    `/api/policies/${policyId}/editor-content`,
  )
  return { ...res, data: normalizePolicyEditorContent(res.data) }
}

/**
 * 获取策略当前生效版本的检测参数（项目绑定默认值）
 * @param policyId - 策略 ID
 */
export async function getPolicyDetectParams(
  policyId: string,
): Promise<ApiResponse<PolicyDetectParams | null>> {
  const res = await request.get<ApiResponse<unknown>>(`/api/policies/${policyId}/detect-params`)
  return { ...res, data: normalizePolicyDetectParams(res.data) }
}

/**
 * 删除策略
 * @param policyId - 要删除的策略 ID
 */
export function deletePolicy(policyId: string): Promise<ApiResponse<null>> {
  return request.delete(`/api/policies/${policyId}`)
}

/**
 * 按 ID 获取策略摘要（刷新后兜底策略名）
 * @param policyId - 策略 ID
 * @returns 策略摘要；后端查不到时为 null
 */
export async function getPolicyById(policyId: string): Promise<ApiResponse<Policy | null>> {
  const res = await request.get<ApiResponse<unknown>>(`/api/policies/${policyId}`)
  return { ...res, data: normalizePolicyDetail(res.data) }
}

/**
 * 导入策略文件（JSON/YAML），后端异步校验
 * @param params - 文件、导入模式与导入前校验项
 */
export function importPolicy(params: PolicyImportParams): Promise<ApiResponse<null>> {
  return request.post('/api/policies/import', buildImportPolicyFormData(params), MULTIPART_CONFIG)
}

/**
 * 获取策略规则命中追溯列表（分页 + 筛选）
 * @param params - 策略 ID、分页与筛选参数；policyId 走 path，其余作为 query
 */
export async function getPolicyRuleHitList(
  params: PolicyRuleHitQueryParams,
): Promise<ApiResponse<PageResult<PolicyRuleHitListItem>>> {
  const { policyId, ...query } = params
  const res = await request.get<ApiResponse<unknown>>(`/api/policies/${policyId}/rule-hits`, {
    params: query,
  })
  return { ...res, data: normalizePolicyRuleHitPage(res.data) }
}

/**
 * 获取单条规则命中追溯详情
 * @param hitId - 命中记录 ID
 * @returns 命中详情；后端查不到时为 null
 */
export async function getPolicyRuleHitDetail(
  hitId: string,
): Promise<ApiResponse<PolicyRuleHitDetail | null>> {
  const res = await request.get<ApiResponse<unknown>>(`/api/policies/rule-hits/${hitId}`)
  return { ...res, data: normalizePolicyRuleHitDetail(res.data) }
}

/**
 * 获取策略版本与审批页概览统计
 * @param policyId - 策略 ID
 * @returns 概览统计；后端查不到时为 null
 */
export async function getPolicyGovernanceOverview(
  policyId: string,
): Promise<ApiResponse<PolicyGovernanceOverview | null>> {
  const res = await request.get<ApiResponse<unknown>>(
    `/api/policies/${policyId}/governance/overview`,
  )
  return { ...res, data: normalizePolicyGovernanceOverview(res.data) }
}

/**
 * 获取策略版本列表（分页）
 * @param policyId - 策略 ID
 * @param params - 分页参数
 */
export async function getPolicyVersionList(
  policyId: string,
  params: PageParams,
): Promise<ApiResponse<PageResult<PolicyVersionListItem>>> {
  const res = await request.get<ApiResponse<unknown>>(`/api/policies/${policyId}/versions`, {
    params,
  })
  return { ...res, data: normalizePolicyVersionPage(res.data) }
}

/**
 * 提交策略发布申请（携带配置与编辑人 ID）
 * @param params - 版本号、变更摘要、配置文本与 editorId；policyId 走 path（新建时为 `new`）
 */
export async function submitPolicyPublishApplication(
  params: SubmitPolicyPublishParams,
): Promise<ApiResponse<SubmitPolicyPublishResult>> {
  const res = await request.post<ApiResponse<unknown>>(
    `/api/policies/${params.policyId}/publish-requests`,
    submitPolicyPublishParamsToApi(params),
  )
  return { ...res, data: normalizeSubmitPolicyPublishResult(res.data, params) }
}

/**
 * 获取策略版本差异对比（左右版本摘要由后端按行状态解析）
 * @param policyId - 策略 ID
 * @param anchorVersionId - 当前点击的版本行 ID
 * @returns 左右版本摘要；后端无可对比版本时为 null
 */
export async function getPolicyVersionDiff(
  policyId: string,
  anchorVersionId: string,
): Promise<ApiResponse<PolicyVersionDiffResult | null>> {
  const res = await request.get<ApiResponse<unknown>>(
    `/api/policies/${policyId}/versions/${anchorVersionId}/diff`,
  )
  return { ...res, data: normalizePolicyVersionDiffResult(res.data) }
}

/**
 * 导出策略版本差异报告
 * @param policyId - 策略 ID
 * @param anchorVersionId - 当前点击的版本行 ID
 * @returns 下载链接与文件名；后端未生成报告时为 null
 */
export async function exportPolicyVersionDiffReport(
  policyId: string,
  anchorVersionId: string,
): Promise<ApiResponse<PolicyVersionDiffExportResult | null>> {
  // openapi 声明 requestBody 必填但无字段，发空对象避免后端 @RequestBody 校验 400
  const res = await request.post<ApiResponse<unknown>>(
    `/api/policies/${policyId}/versions/${anchorVersionId}/diff/export`,
    {},
  )
  return { ...res, data: normalizePolicyVersionDiffExport(res.data) }
}

/**
 * 提交策略版本发布审批
 * @param params - 审批结论、意见与生效时间；policyId / versionId 走 path
 */
export async function submitPolicyVersionApproval(
  params: SubmitPolicyVersionApprovalParams,
): Promise<ApiResponse<SubmitPolicyVersionApprovalResult>> {
  const res = await request.post<ApiResponse<unknown>>(
    `/api/policies/${params.policyId}/versions/${params.versionId}/approval`,
    submitPolicyVersionApprovalParamsToApi(params),
  )
  return { ...res, data: normalizeSubmitPolicyVersionApprovalResult(res.data, params) }
}

/**
 * 导出策略版本文件
 * @param params - 版本 ID、导出范围与格式
 */
export async function exportPolicyVersion(
  params: ExportPolicyVersionParams,
): Promise<ApiResponse<PolicyVersionExportResult>> {
  const res = await request.post<ApiResponse<unknown>>(
    `/api/policies/${params.policyId}/versions/${params.versionId}/export`,
    exportPolicyVersionParamsToApi(params),
  )
  return { ...res, data: normalizePolicyVersionExport(res.data, params) }
}

/**
 * 回滚策略历史版本为当前生效版本
 * @param params - 目标版本 ID 与确认版本号
 */
export function rollbackPolicyVersion(
  params: RollbackPolicyVersionParams,
): Promise<ApiResponse<null>> {
  return request.post(
    `/api/policies/${params.policyId}/versions/${params.versionId}/rollback`,
    rollbackPolicyVersionParamsToApi(params),
  )
}
