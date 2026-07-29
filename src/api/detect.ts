import request from '@/utils/request'
import type { ApiResponse, PageResult } from '@/types/common'
import {
  buildCreateAiParseTaskFormData,
  buildCreateDetectTaskFormData,
} from '@/utils/formDataBuilders'
import type { FileTreeData } from '@/types/fileTree'
import type {
  DetectTask,
  CreateDetectTaskParams,
  DetectTaskProjectOption,
  OpenSourceRiskDetailSummary,
  OpenSourceRiskComponent,
  OpenSourceRiskComponentDetail,
  OpenSourceRiskComponentQueryParams,
  RiskComponentGraph,
  IgnoreOpenSourceRiskComponentParams,
  OpenSourceRiskVulnerability,
  OpenSourceRiskVulnerabilityDetail,
  OpenSourceRiskVulnerabilityQueryParams,
  OpenSourceRiskSbomModulePreviewRow,
  OpenSourceRiskSbomPackagePreviewRow,
  OpenSourceRiskSbomProjectPreviewRow,
  ExportOpenSourceRiskSbomParams,
  ExportOpenSourceRiskSbomResult,
  OpenSourceRiskSbomPreviewQueryParams,
  RegisterOpenSourceRiskVulnerabilityDispositionParams,
  ReviewOpenSourceRiskVulnerabilityDispositionParams,
  AiParseTask,
  AiParseTaskQueryParams,
  AiParseFallbackCompareItem,
  AiParseResultDetail,
  CreateAiParseTaskParams,
  SubmitAiParseFallbackParams,
  TaskQueryParams,
  UpdateDetectTaskParams,
  TerminateTaskParams,
  VulnDbVersionOption,
  AutonomyDetectResultOverview,
  AutonomyFileDetail,
  AutonomySourceHitItem,
  AutonomySourceHitQueryParams,
} from '@/types/detect'
import {
  detectTaskQueryParamsToApi,
  hasDetectTaskBody,
  normalizeDetectTask,
  normalizeDetectTaskPage,
  normalizeDetectTaskProjectOptions,
  normalizeVulnDbVersionOptions,
} from '@/utils/detectAdapter'
import {
  autonomySourceHitQueryParamsToApi,
  mergeAutonomyOverviewWithTask,
  normalizeAutonomyDetectResultOverview,
  normalizeAutonomyEvidenceTree,
  normalizeAutonomyFileDetail,
  normalizeAutonomySourceHitPage,
} from '@/utils/autonomyDetectAdapter'
import {
  aiParseTaskQueryParamsToApi,
  normalizeAiParseFallbackCompareList,
  normalizeAiParseResultDetail,
  normalizeAiParseTask,
  normalizeAiParseTaskPage,
  submitAiParseFallbackParamsToApi,
} from '@/utils/aiParseAdapter'
import { getMockOpenSourceRiskDetailSummary } from '@/mock/modules/detect/openSourceRiskDetail'
import {
  getMockOpenSourceRiskComponentPage,
  getMockOpenSourceRiskComponentDetail,
  mockIgnoreOpenSourceRiskComponent,
  mockRevokeOpenSourceRiskComponentIgnore,
} from '@/mock/modules/detect/openSourceRiskComponents'
import { getMockRiskComponentGraph } from '@/mock/modules/detect/riskComponentGraph'
import { getMockOpenSourceRiskVulnerabilityPage, countMockOpenSourceRiskVulnerabilitiesByComponent } from '@/mock/modules/detect/openSourceRiskVulnerabilities'
import {
  getMockOpenSourceRiskVulnerabilityDetail,
  mockRegisterOpenSourceRiskVulnerabilityDisposition,
  mockReviewOpenSourceRiskVulnerabilityDisposition,
} from '@/mock/modules/detect/openSourceRiskVulnerabilityDetail'
import {
  getMockOpenSourceRiskSbomPreviewPage,
  mockExportOpenSourceRiskSbom,
} from '@/mock/modules/detect/openSourceRiskSbom'

/** multipart 请求头：显式声明后 axios 才会保留 FormData（默认 JSON 头会被序列化） */
const MULTIPART_CONFIG = { headers: { 'Content-Type': 'multipart/form-data' } }

/**
 * 获取检测任务列表（自主率 / 开源风险共用）
 * @param params - 筛选与分页参数，空值不下发
 */
export async function getTaskList(
  params: TaskQueryParams,
): Promise<ApiResponse<PageResult<DetectTask>>> {
  const res = await request.get<ApiResponse<unknown>>('/api/detect/tasks', {
    params: detectTaskQueryParamsToApi(params),
  })
  return { ...res, data: normalizeDetectTaskPage(res.data, params.taskType || undefined) }
}

/**
 * 获取创建检测任务时的关联项目下拉选项
 */
export async function getDetectTaskProjectOptions(): Promise<
  ApiResponse<DetectTaskProjectOption[]>
> {
  const res = await request.get<ApiResponse<unknown>>('/api/detect/tasks/project-options')
  return { ...res, data: normalizeDetectTaskProjectOptions(res.data) }
}

/**
 * 获取开源风险检测可选的漏洞库版本列表
 */
export async function getRiskDetectVulnDbVersions(): Promise<ApiResponse<VulnDbVersionOption[]>> {
  const res = await request.get<ApiResponse<unknown>>('/api/detect/tasks/risk/vuln-db-versions')
  return { ...res, data: normalizeVulnDbVersionOptions(res.data) }
}

/**
 * 创建检测任务（自主率 / 开源风险）
 * @param data - 按 taskType 区分的创建参数，统一以 multipart 提交
 */
export async function createDetectTask(
  data: CreateDetectTaskParams,
): Promise<ApiResponse<DetectTask>> {
  if (!data.taskName.trim()) {
    return Promise.reject(new Error('请输入任务名称'))
  }

  const res = await request.post<ApiResponse<unknown>>(
    '/api/detect/tasks',
    buildCreateDetectTaskFormData(data),
    MULTIPART_CONFIG,
  )
  return { ...res, data: normalizeDetectTask((res.data ?? {}) as Record<string, unknown>) }
}

/** 获取任务详情 */
export async function getTaskDetail(taskId: string): Promise<ApiResponse<DetectTask>> {
  const res = await request.get<ApiResponse<unknown>>(`/api/detect/tasks/${taskId}`)
  return { ...res, data: normalizeDetectTask((res.data ?? {}) as Record<string, unknown>) }
}

/**
 * 暂停/继续/终止/编辑等操作后统一取回任务主体
 * 后端部分动作接口只回 `{ reason }` 之类的片段，此时回查详情，保证列表行能正确刷新
 * @param taskId - 任务 ID
 * @param res - 动作接口原始响应
 */
async function resolveTaskActionResult(
  taskId: string,
  res: ApiResponse<unknown>,
): Promise<ApiResponse<DetectTask>> {
  if (hasDetectTaskBody(res.data)) {
    return { ...res, data: normalizeDetectTask(res.data) }
  }
  const detail = await getTaskDetail(taskId)
  return { ...res, data: detail.data }
}

// 以下开源风险结果/详情类接口仍为 mock

/**
 * 获取自主率检测结果 · 顶部总体摘要
 * 页面跳转后按路由 taskId 拉取，用于环形自主率图与统计卡片
 * @param taskId - 检测任务 ID
 * @returns 总体/风险自主率与问题数统计
 */
export async function getAutonomyDetectResultOverview(
  taskId: string,
): Promise<ApiResponse<AutonomyDetectResultOverview>> {
  const res = await request.get<ApiResponse<unknown>>(
    `/api/detect/tasks/${taskId}/autonomy/overview`,
  )
  let overview = normalizeAutonomyDetectResultOverview(res.data, taskId)

  if (!overview.taskName || !overview.projectName) {
    try {
      const taskRes = await getTaskDetail(taskId)
      overview = mergeAutonomyOverviewWithTask(overview, {
        taskName: taskRes.data.taskName,
        projectName: taskRes.data.projectName,
        status: taskRes.data.status,
        finishedAt: taskRes.data.finishedAt ?? null,
      })
    } catch {
      /* 任务详情失败时仍展示 overview 已有字段 */
    }
  }

  return { ...res, data: overview }
}

/**
 * 获取自主率检测结果 · 相似代码证据文件树
 * 页面进入时按 taskId 拉取，供左侧目录树展示
 * @param taskId - 检测任务 ID
 */
export async function getAutonomyDetectEvidenceTree(
  taskId: string,
): Promise<ApiResponse<FileTreeData>> {
  const res = await request.get<ApiResponse<unknown>>(
    `/api/detect/tasks/${taskId}/autonomy/evidence-tree`,
  )
  return { ...res, data: normalizeAutonomyEvidenceTree(res.data) }
}

/**
 * 获取自主率检测结果 · 单文件详情（摘要 + 全量代码/指纹证据，前端分页展示）
 * @param taskId - 检测任务 ID
 * @param fileId - 证据树文件节点 ID
 * @param fileName - 文件名（展示与 mock 匹配）
 */
export async function getAutonomyDetectFileDetail(
  taskId: string,
  fileId: string,
  fileName: string,
): Promise<ApiResponse<AutonomyFileDetail>> {
  const res = await request.get<ApiResponse<unknown>>(
    `/api/detect/tasks/${taskId}/autonomy/files/${fileId}`,
    { params: fileName ? { fileName } : undefined },
  )
  return {
    ...res,
    data: normalizeAutonomyFileDetail(res.data, { fileId, fileName }),
  }
}

/**
 * 获取自主率检测结果 · 来源汇总列表（分页）
 * @param taskId - 检测任务 ID
 * @param params - 来源项目名 / 风险等级筛选与分页
 */
export async function getAutonomyDetectSourceHitList(
  taskId: string,
  params: AutonomySourceHitQueryParams,
): Promise<ApiResponse<PageResult<AutonomySourceHitItem>>> {
  const res = await request.get<ApiResponse<unknown>>(
    `/api/detect/tasks/${taskId}/autonomy/source-hits`,
    { params: autonomySourceHitQueryParamsToApi(params) },
  )
  // 兼容 list 挂在 body 顶层而非 data 内的后端实现
  const pageRaw = res.data ?? res
  return { ...res, data: normalizeAutonomySourceHitPage(pageRaw) }
}

/**
 * 获取开源风险检测详情统计摘要
 * @param taskId - 检测任务 ID
 */
export function getOpenSourceRiskDetailSummary(
  taskId: string,
): Promise<ApiResponse<OpenSourceRiskDetailSummary>> {
  // TODO: replace with → return request.get(`/api/detect/tasks/${taskId}/risk/summary`)
  return Promise.resolve({
    code: 200,
    message: 'ok',
    data: getMockOpenSourceRiskDetailSummary(taskId),
  })
}

/**
 * 获取开源风险检测 · 组件清单（分页）
 * @param taskId - 任务 ID
 * @param params - 筛选与分页
 */
export function getOpenSourceRiskComponentList(
  taskId: string,
  params: OpenSourceRiskComponentQueryParams,
): Promise<ApiResponse<PageResult<OpenSourceRiskComponent>>> {
  // TODO: replace with → return request.get(`/api/detect/tasks/${taskId}/risk/components`, { params })
  return Promise.resolve({
    code: 200,
    message: 'ok',
    data: getMockOpenSourceRiskComponentPage(taskId, params),
  })
}

/**
 * 获取开源风险检测 · 组件依赖关系图（G6 渲染用，节点 + 边）
 * @param taskId - 任务 ID
 * @returns 依赖图数据，节点复用组件清单 ID，便于点击打开详情抽屉
 */
export function getRiskComponentGraph(taskId: string): Promise<ApiResponse<RiskComponentGraph>> {
  // TODO: replace with → return request.get(`/api/detect/tasks/${taskId}/risk/component-graph`)
  return Promise.resolve({
    code: 200,
    message: 'ok',
    data: getMockRiskComponentGraph(taskId),
  })
}

/**
 * 获取开源风险检测 · 组件详情（抽屉）
 * @param taskId - 任务 ID
 * @param componentId - 组件 ID
 */
export function getOpenSourceRiskComponentDetail(
  taskId: string,
  componentId: string,
): Promise<ApiResponse<OpenSourceRiskComponentDetail>> {
  const detail = getMockOpenSourceRiskComponentDetail(taskId, componentId)
  if (!detail) {
    return Promise.reject(new Error('组件不存在'))
  }
  detail.relatedVulnerabilityCount = countMockOpenSourceRiskVulnerabilitiesByComponent(
    taskId,
    detail.componentName,
  )
  // TODO: replace with → return request.get(`/api/detect/tasks/${taskId}/risk/components/${componentId}`)
  return Promise.resolve({ code: 200, message: 'ok', data: detail })
}

/**
 * 忽略开源风险组件（项目级，不再纳入统计与报告）
 * @param taskId - 任务 ID
 * @param componentId - 组件 ID
 * @param data - 忽略原因
 */
export function ignoreOpenSourceRiskComponent(
  taskId: string,
  componentId: string,
  data: IgnoreOpenSourceRiskComponentParams,
): Promise<ApiResponse<null>> {
  const ok = mockIgnoreOpenSourceRiskComponent(taskId, componentId, data.reason)
  if (!ok) {
    return Promise.reject(new Error('组件不存在'))
  }
  // TODO: replace with → return request.post(`/api/detect/tasks/${taskId}/risk/components/${componentId}/ignore`, data)
  return Promise.resolve({ code: 200, message: 'ok', data: null })
}

/**
 * 撤销忽略开源风险组件
 * @param taskId - 任务 ID
 * @param componentId - 组件 ID
 */
export function revokeOpenSourceRiskComponentIgnore(
  taskId: string,
  componentId: string,
): Promise<ApiResponse<null>> {
  const ok = mockRevokeOpenSourceRiskComponentIgnore(taskId, componentId)
  if (!ok) {
    return Promise.reject(new Error('组件未忽略或不存在'))
  }
  // TODO: replace with → return request.delete(`/api/detect/tasks/${taskId}/risk/components/${componentId}/ignore`)
  return Promise.resolve({ code: 200, message: 'ok', data: null })
}

/**
 * 获取开源风险检测 · 漏洞风险清单（分页）
 * @param taskId - 任务 ID
 * @param params - 筛选与分页
 */
export function getOpenSourceRiskVulnerabilityList(
  taskId: string,
  params: OpenSourceRiskVulnerabilityQueryParams,
): Promise<ApiResponse<PageResult<OpenSourceRiskVulnerability>>> {
  // TODO: replace with → return request.get(`/api/detect/tasks/${taskId}/risk/vulnerabilities`, { params })
  return Promise.resolve({
    code: 200,
    message: 'ok',
    data: getMockOpenSourceRiskVulnerabilityPage(taskId, params),
  })
}

/**
 * 获取开源风险 · 漏洞详情（抽屉打开时拉取）
 * @param taskId - 任务 ID
 * @param vulnerabilityId - 漏洞 ID
 */
export function getOpenSourceRiskVulnerabilityDetail(
  taskId: string,
  vulnerabilityId: string,
): Promise<ApiResponse<OpenSourceRiskVulnerabilityDetail>> {
  const detail = getMockOpenSourceRiskVulnerabilityDetail(taskId, vulnerabilityId)
  if (!detail) {
    return Promise.reject(new Error('漏洞不存在'))
  }
  // TODO: replace with → return request.get(`/api/detect/tasks/${taskId}/risk/vulnerabilities/${vulnerabilityId}`)
  return Promise.resolve({ code: 200, message: 'ok', data: detail })
}

/**
 * 登记开源风险漏洞处置
 * @param taskId - 任务 ID
 * @param vulnerabilityId - 漏洞 ID
 * @param data - 登记表单
 */
export function registerOpenSourceRiskVulnerabilityDisposition(
  taskId: string,
  vulnerabilityId: string,
  data: RegisterOpenSourceRiskVulnerabilityDispositionParams,
): Promise<ApiResponse<null>> {
  const ok = mockRegisterOpenSourceRiskVulnerabilityDisposition(taskId, vulnerabilityId, data)
  if (!ok) {
    return Promise.reject(new Error('当前状态不可登记处置'))
  }
  // TODO: replace with → return request.post(`/api/detect/tasks/${taskId}/risk/vulnerabilities/${vulnerabilityId}/disposition`, data)
  return Promise.resolve({ code: 200, message: 'ok', data: null })
}

/**
 * 复核开源风险漏洞处置
 * @param taskId - 任务 ID
 * @param vulnerabilityId - 漏洞 ID
 * @param data - 复核表单
 */
export function reviewOpenSourceRiskVulnerabilityDisposition(
  taskId: string,
  vulnerabilityId: string,
  data: ReviewOpenSourceRiskVulnerabilityDispositionParams,
): Promise<ApiResponse<null>> {
  const ok = mockReviewOpenSourceRiskVulnerabilityDisposition(taskId, vulnerabilityId, data)
  if (!ok) {
    return Promise.reject(new Error('当前状态不可复核'))
  }
  // TODO: replace with → return request.post(`/api/detect/tasks/${taskId}/risk/vulnerabilities/${vulnerabilityId}/disposition/review`, data)
  return Promise.resolve({ code: 200, message: 'ok', data: null })
}

/**
 * 获取开源风险 · SBOM 清单预览（分页）
 * @param taskId - 任务 ID
 * @param params - 输出粒度与分页
 */
export function getOpenSourceRiskSbomPreview(
  taskId: string,
  params: OpenSourceRiskSbomPreviewQueryParams,
): Promise<
  ApiResponse<
    PageResult<
      | OpenSourceRiskSbomProjectPreviewRow
      | OpenSourceRiskSbomModulePreviewRow
      | OpenSourceRiskSbomPackagePreviewRow
    >
  >
> {
  // TODO: replace with → return request.get(`/api/detect/tasks/${taskId}/risk/sbom/preview`, { params })
  return Promise.resolve({
    code: 200,
    message: 'ok',
    data: getMockOpenSourceRiskSbomPreviewPage(taskId, params),
  })
}

/**
 * 导出开源风险 SBOM 文件
 * @param taskId - 任务 ID
 * @param data - 标准格式、文件格式与输出粒度
 */
export function exportOpenSourceRiskSbom(
  taskId: string,
  data: ExportOpenSourceRiskSbomParams,
): Promise<ApiResponse<ExportOpenSourceRiskSbomResult>> {
  // TODO: replace with → return request.post(`/api/detect/tasks/${taskId}/risk/sbom/export`, data)
  return Promise.resolve({
    code: 200,
    message: 'ok',
    data: mockExportOpenSourceRiskSbom(taskId, data),
  })
}

/**
 * 获取 AI 解析历史列表（分页）
 * @param params - 筛选与分页
 */
export async function getAiParseTaskList(
  params: AiParseTaskQueryParams,
): Promise<ApiResponse<PageResult<AiParseTask>>> {
  const res = await request.get<ApiResponse<unknown>>('/api/detect/ai-parse/tasks', {
    params: aiParseTaskQueryParamsToApi(params),
  })
  const pageRaw = res.data ?? res
  return { ...res, data: normalizeAiParseTaskPage(pageRaw) }
}

/**
 * 创建 AI 解析任务
 * @param data - 项目、来源与扫描深度
 */
export async function createAiParseTask(
  data: CreateAiParseTaskParams,
): Promise<ApiResponse<AiParseTask>> {
  const formData = buildCreateAiParseTaskFormData(data)
  const res = await request.post<ApiResponse<unknown>>(
    '/api/detect/ai-parse/tasks',
    formData,
    MULTIPART_CONFIG,
  )
  const taskRaw =
    res.data && typeof res.data === 'object' ? (res.data as Record<string, unknown>) : {}
  return { ...res, data: normalizeAiParseTask(taskRaw) }
}

/**
 * 获取 AI 解析结果详情（抽屉打开时拉取）
 * @param parseTaskId - 解析任务 ID
 */
export async function getAiParseResultDetail(
  parseTaskId: string,
): Promise<ApiResponse<AiParseResultDetail>> {
  const res = await request.get<ApiResponse<unknown>>(
    `/api/detect/ai-parse/tasks/${parseTaskId}/result`,
  )
  return { ...res, data: normalizeAiParseResultDetail(res.data, parseTaskId) }
}

/**
 * 获取 AI 解析规则回退对比项
 * @param parseTaskId - 解析任务 ID
 */
export async function getAiParseFallbackCompare(
  parseTaskId: string,
): Promise<ApiResponse<AiParseFallbackCompareItem[]>> {
  const res = await request.get<ApiResponse<unknown>>(
    `/api/detect/ai-parse/tasks/${parseTaskId}/fallback-compare`,
  )
  const listRaw = res.data ?? res
  return { ...res, data: normalizeAiParseFallbackCompareList(listRaw) }
}

/**
 * 确认规则回退并重新提交解析
 * @param parseTaskId - 解析任务 ID
 * @param data - 回退原因
 */
export async function submitAiParseFallback(
  parseTaskId: string,
  data: SubmitAiParseFallbackParams,
): Promise<ApiResponse<AiParseTask>> {
  const res = await request.post<ApiResponse<unknown>>(
    `/api/detect/ai-parse/tasks/${parseTaskId}/fallback`,
    submitAiParseFallbackParamsToApi(data),
  )
  const taskRaw =
    res.data && typeof res.data === 'object' ? (res.data as Record<string, unknown>) : {}
  return { ...res, data: normalizeAiParseTask(taskRaw) }
}

/**
 * 编辑检测任务（排队中 / 运行中的自主率任务）
 * @param taskId - 任务 ID
 * @param data - 任务名称、扫描模式、重试次数
 */
export async function updateDetectTask(
  taskId: string,
  data: UpdateDetectTaskParams,
): Promise<ApiResponse<DetectTask>> {
  const res = await request.put<ApiResponse<unknown>>(`/api/detect/tasks/${taskId}`, data)
  return resolveTaskActionResult(taskId, res)
}

/** 删除任务（DELETE 带 body `{ taskId }`，与 openapi 一致） */
export function deleteTask(taskId: string): Promise<ApiResponse<null>> {
  return request.delete(`/api/detect/tasks/${taskId}`, { data: { taskId } })
}

/** 暂停任务 */
export async function pauseTask(taskId: string): Promise<ApiResponse<DetectTask>> {
  const res = await request.post<ApiResponse<unknown>>(`/api/detect/tasks/${taskId}/pause`, {
    taskId,
  })
  return resolveTaskActionResult(taskId, res)
}

/** 继续任务（从已暂停恢复为运行中） */
export async function resumeTask(taskId: string): Promise<ApiResponse<DetectTask>> {
  const res = await request.post<ApiResponse<unknown>>(`/api/detect/tasks/${taskId}/resume`, {
    taskId,
  })
  return resolveTaskActionResult(taskId, res)
}

/**
 * 终止任务
 * @param taskId - 任务 ID
 * @param data - 终止原因（必填）
 */
export async function terminateTask(
  taskId: string,
  data: TerminateTaskParams,
): Promise<ApiResponse<DetectTask>> {
  const res = await request.post<ApiResponse<unknown>>(
    `/api/detect/tasks/${taskId}/terminate`,
    data,
  )
  return resolveTaskActionResult(taskId, res)
}
