import type { ApiResponse, PageResult } from '@/types/common'
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
  OpenSourceRiskVulnerabilityQueryParams,
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
  AutonomySourceHitItem,
  AutonomySourceHitQueryParams,
} from '@/types/detect'
import { MOCK_ALL_DETECT_TASKS } from '@/mock/modules/detect/taskList'
import {
  getMockDetectTaskProjectOptions,
  getMockVulnDbVersionOptions,
  mockCreateDetectTask,
} from '@/mock/modules/detect/taskCreateOptions'
import { getMockOpenSourceRiskDetailSummary } from '@/mock/modules/detect/openSourceRiskDetail'
import { getMockAutonomyDetectResultOverview } from '@/mock/modules/detect/autonomyResult'
import { getMockAutonomyDetectEvidenceTree } from '@/mock/modules/detect/autonomyEvidenceTree'
import { getMockAutonomySourceHitPage } from '@/mock/modules/detect/autonomySourceHits'
import {
  getMockOpenSourceRiskComponentPage,
  getMockOpenSourceRiskComponentDetail,
  mockIgnoreOpenSourceRiskComponent,
  mockRevokeOpenSourceRiskComponentIgnore,
} from '@/mock/modules/detect/openSourceRiskComponents'
import { getMockRiskComponentGraph } from '@/mock/modules/detect/riskComponentGraph'
import { getMockOpenSourceRiskVulnerabilityPage, countMockOpenSourceRiskVulnerabilitiesByComponent } from '@/mock/modules/detect/openSourceRiskVulnerabilities'
import {
  getMockAiParseTaskPage,
  mockCreateAiParseTask,
  getMockAiParseFallbackCompare,
  mockSubmitAiParseFallback,
} from '@/mock/modules/detect/aiParseTasks'
import { getMockAiParseResultDetail } from '@/mock/modules/detect/aiParseResultDetail'

// TODO: replace with: import request from '@/utils/request'

const DEFAULT_PAGE_SIZE = 10

function findMockTask(taskId: string): DetectTask | undefined {
  return MOCK_ALL_DETECT_TASKS.find((t) => t.taskId === taskId)
}

function filterMockTasks(params: TaskQueryParams): DetectTask[] {
  let list = [...MOCK_ALL_DETECT_TASKS]

  const taskName = params.taskName?.trim()
  if (taskName) {
    list = list.filter((t) => t.taskName.includes(taskName))
  }

  if (params.taskType) {
    list = list.filter((t) => t.taskType === params.taskType)
  }

  const projectName = params.projectName?.trim()
  if (projectName) {
    list = list.filter((t) => t.projectName.includes(projectName))
  }

  if (params.projectId) {
    list = list.filter((t) => t.projectId === params.projectId)
  }

  if (params.status) {
    list = list.filter((t) => t.status === params.status)
  }

  return list.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

/**
 * mock 阶段分页：按筛选条件过滤后按 createdAt 倒序切片
 * 联调时改为 request.get('/api/detect/tasks', { params })
 */
export function getTaskList(params: TaskQueryParams): Promise<ApiResponse<PageResult<DetectTask>>> {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE

  const sorted = filterMockTasks(params)
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
 * 获取创建检测任务时的关联项目下拉选项
 */
export function getDetectTaskProjectOptions(): Promise<ApiResponse<DetectTaskProjectOption[]>> {
  // TODO: replace with → return request.get('/api/detect/tasks/project-options')
  return Promise.resolve({
    code: 200,
    message: 'ok',
    data: getMockDetectTaskProjectOptions(),
  })
}

/**
 * 获取开源风险检测可选的漏洞库版本列表
 */
export function getRiskDetectVulnDbVersions(): Promise<ApiResponse<VulnDbVersionOption[]>> {
  // TODO: replace with → return request.get('/api/detect/tasks/risk/vuln-db-versions')
  return Promise.resolve({
    code: 200,
    message: 'ok',
    data: getMockVulnDbVersionOptions(),
  })
}

/**
 * 创建检测任务（自主率 / 开源风险）
 * @param data - 按 taskType 区分的创建参数
 */
export function createDetectTask(data: CreateDetectTaskParams): Promise<ApiResponse<DetectTask>> {
  if (!data.taskName.trim()) {
    return Promise.reject(new Error('请输入任务名称'))
  }

  // TODO: replace with → return request.post('/api/detect/tasks', data)
  return Promise.resolve({
    code: 200,
    message: 'ok',
    data: mockCreateDetectTask(data),
  })
}

/** 获取任务详情 */
export function getTaskDetail(taskId: string): Promise<ApiResponse<DetectTask>> {
  // TODO: replace with → return request.get(`/api/detect/tasks/${taskId}`)
  const task = findMockTask(taskId)
  if (!task) {
    return Promise.reject(new Error('任务不存在'))
  }
  return Promise.resolve({ code: 200, message: 'ok', data: task })
}

/**
 * 获取自主率检测结果 · 顶部总体摘要
 * 页面跳转后按路由 taskId 拉取，用于环形自主率图与统计卡片
 * @param taskId - 检测任务 ID
 * @returns 总体/风险自主率与问题数统计
 */
export function getAutonomyDetectResultOverview(
  taskId: string,
): Promise<ApiResponse<AutonomyDetectResultOverview>> {
  if (!findMockTask(taskId)) {
    return Promise.reject(new Error('任务不存在'))
  }
  // TODO: replace with → return request.get(`/api/detect/tasks/${taskId}/autonomy/overview`)
  return Promise.resolve({
    code: 200,
    message: 'ok',
    data: getMockAutonomyDetectResultOverview(taskId),
  })
}

/**
 * 获取自主率检测结果 · 相似代码证据文件树
 * 页面进入时按 taskId 拉取，供左侧目录树展示
 * @param taskId - 检测任务 ID
 */
export function getAutonomyDetectEvidenceTree(
  taskId: string,
): Promise<ApiResponse<FileTreeData>> {
  if (!findMockTask(taskId)) {
    return Promise.reject(new Error('任务不存在'))
  }
  // TODO: replace with → return request.get(`/api/detect/tasks/${taskId}/autonomy/evidence-tree`)
  return Promise.resolve({
    code: 200,
    message: 'ok',
    data: getMockAutonomyDetectEvidenceTree(taskId),
  })
}

/**
 * 获取自主率检测结果 · 来源汇总列表（分页）
 * @param taskId - 检测任务 ID
 * @param params - 来源项目名 / 风险等级筛选与分页
 */
export function getAutonomyDetectSourceHitList(
  taskId: string,
  params: AutonomySourceHitQueryParams,
): Promise<ApiResponse<PageResult<AutonomySourceHitItem>>> {
  if (!findMockTask(taskId)) {
    return Promise.reject(new Error('任务不存在'))
  }
  // TODO: replace with → return request.get(`/api/detect/tasks/${taskId}/autonomy/source-hits`, { params })
  return Promise.resolve({
    code: 200,
    message: 'ok',
    data: getMockAutonomySourceHitPage(taskId, params),
  })
}

/**
 * 获取开源风险检测详情统计摘要
 * @param taskId - 检测任务 ID
 */
export function getOpenSourceRiskDetailSummary(
  taskId: string,
): Promise<ApiResponse<OpenSourceRiskDetailSummary>> {
  if (!findMockTask(taskId)) {
    return Promise.reject(new Error('任务不存在'))
  }
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
  if (!findMockTask(taskId)) {
    return Promise.reject(new Error('任务不存在'))
  }
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
  if (!findMockTask(taskId)) {
    return Promise.reject(new Error('任务不存在'))
  }
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
  if (!findMockTask(taskId)) {
    return Promise.reject(new Error('任务不存在'))
  }
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
  if (!findMockTask(taskId)) {
    return Promise.reject(new Error('任务不存在'))
  }
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
  if (!findMockTask(taskId)) {
    return Promise.reject(new Error('任务不存在'))
  }
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
  if (!findMockTask(taskId)) {
    return Promise.reject(new Error('任务不存在'))
  }
  // TODO: replace with → return request.get(`/api/detect/tasks/${taskId}/risk/vulnerabilities`, { params })
  return Promise.resolve({
    code: 200,
    message: 'ok',
    data: getMockOpenSourceRiskVulnerabilityPage(taskId, params),
  })
}

/**
 * 获取 AI 解析历史列表（分页）
 * @param params - 筛选与分页
 */
export function getAiParseTaskList(
  params: AiParseTaskQueryParams,
): Promise<ApiResponse<PageResult<AiParseTask>>> {
  // TODO: replace with → return request.get('/api/detect/ai-parse/tasks', { params })
  return Promise.resolve({
    code: 200,
    message: 'ok',
    data: getMockAiParseTaskPage(params),
  })
}

/**
 * 创建 AI 解析任务
 * @param data - 项目、来源与扫描深度
 */
export function createAiParseTask(
  data: CreateAiParseTaskParams,
): Promise<ApiResponse<AiParseTask>> {
  // TODO: replace with → return request.post('/api/detect/ai-parse/tasks', data)
  const task = mockCreateAiParseTask(data)
  return Promise.resolve({ code: 200, message: 'ok', data: task })
}

/**
 * 获取 AI 解析结果详情（抽屉打开时拉取）
 * @param parseTaskId - 解析任务 ID
 */
export function getAiParseResultDetail(
  parseTaskId: string,
): Promise<ApiResponse<AiParseResultDetail>> {
  const detail = getMockAiParseResultDetail(parseTaskId)
  if (!detail) {
    return Promise.reject(new Error('解析结果不存在或任务未完成'))
  }
  // TODO: replace with → return request.get(`/api/detect/ai-parse/tasks/${parseTaskId}/result`)
  return Promise.resolve({ code: 200, message: 'ok', data: detail })
}

/**
 * 获取 AI 解析规则回退对比项
 * @param parseTaskId - 解析任务 ID
 */
export function getAiParseFallbackCompare(
  parseTaskId: string,
): Promise<ApiResponse<AiParseFallbackCompareItem[]>> {
  // TODO: replace with → return request.get(`/api/detect/ai-parse/tasks/${parseTaskId}/fallback-compare`)
  const list = getMockAiParseFallbackCompare(parseTaskId)
  if (list.length === 0) {
    return Promise.reject(new Error('解析任务不存在或无回退数据'))
  }
  return Promise.resolve({ code: 200, message: 'ok', data: list })
}

/**
 * 确认规则回退并重新提交解析
 * @param parseTaskId - 解析任务 ID
 * @param data - 回退原因
 */
export function submitAiParseFallback(
  parseTaskId: string,
  data: SubmitAiParseFallbackParams,
): Promise<ApiResponse<AiParseTask>> {
  // TODO: replace with → return request.post(`/api/detect/ai-parse/tasks/${parseTaskId}/fallback`, data)
  const task = mockSubmitAiParseFallback(parseTaskId, data.reason)
  if (!task) {
    return Promise.reject(new Error('仅失败状态的解析任务可规则回退'))
  }
  return Promise.resolve({ code: 200, message: 'ok', data: task })
}

/** 编辑检测任务（排队中 / 运行中的自主率任务） */
export function updateDetectTask(
  taskId: string,
  data: UpdateDetectTaskParams,
): Promise<ApiResponse<DetectTask>> {
  // TODO: replace with → return request.put(`/api/detect/tasks/${taskId}`, data)
  const task = findMockTask(taskId)
  if (!task) {
    return Promise.reject(new Error('任务不存在'))
  }
  task.taskName = data.taskName
  task.sourceMode = data.sourceMode
  task.retryCount = data.retryCount
  return Promise.resolve({ code: 200, message: '保存成功', data: { ...task } })
}

/** 删除任务 */
export function deleteTask(taskId: string): Promise<ApiResponse<null>> {
  // TODO: replace with → return request.delete(`/api/detect/tasks/${taskId}`)
  const idx = MOCK_ALL_DETECT_TASKS.findIndex((t) => t.taskId === taskId)
  if (idx >= 0) {
    MOCK_ALL_DETECT_TASKS.splice(idx, 1)
  }
  return Promise.resolve({ code: 200, message: '删除成功', data: null })
}

/** 暂停任务 */
export function pauseTask(taskId: string): Promise<ApiResponse<DetectTask>> {
  // TODO: replace with → return request.post(`/api/detect/tasks/${taskId}/pause`)
  const task = findMockTask(taskId)
  if (!task) {
    return Promise.reject(new Error('任务不存在'))
  }
  task.status = 'paused'
  return Promise.resolve({ code: 200, message: '已暂停', data: { ...task } })
}

/** 继续任务（从已暂停恢复为运行中） */
export function resumeTask(taskId: string): Promise<ApiResponse<DetectTask>> {
  // TODO: replace with → return request.post(`/api/detect/tasks/${taskId}/resume`)
  const task = findMockTask(taskId)
  if (!task) {
    return Promise.reject(new Error('任务不存在'))
  }
  task.status = 'running'
  return Promise.resolve({ code: 200, message: '已继续运行', data: { ...task } })
}

/** 终止任务 */
export function terminateTask(
  taskId: string,
  data: TerminateTaskParams,
): Promise<ApiResponse<DetectTask>> {
  // TODO: replace with → return request.post(`/api/detect/tasks/${taskId}/terminate`, data)
  const task = findMockTask(taskId)
  if (!task) {
    return Promise.reject(new Error('任务不存在'))
  }
  task.status = 'terminated'
  task.finishedAt = new Date().toISOString()
  task.errorMsg = data.reason
  return Promise.resolve({ code: 200, message: '已终止', data: { ...task } })
}
