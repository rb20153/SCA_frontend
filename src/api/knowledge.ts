import type { ApiResponse, PageResult } from '@/types/common'
import type {
  KbProject,
  KbProjectQueryParams,
  KnowledgeCoverageOverview,
  KbVersion,
  KbVersionOverview,
  KbVersionQueryParams,
  UpdateKbProjectParams,
  ImportOfflineVulnPackageParams,
  SyncVulnSourceParams,
  VulnItemDetail,
  VulnItemExportParams,
  VulnItemExportResult,
  VulnItemListItem,
  VulnItemListQueryParams,
  VulnItemOverview,
  VulnItemOverviewQueryParams,
  VulnItemQuickSearchSuggestion,
  VulnKnowledgeOverview,
  VulnSource,
  VulnSourceQueryParams,
  VulnSyncAllPreview,
} from '@/types/knowledge'
import { MOCK_ALL_KB_PROJECTS } from '@/mock/modules/knowledge/knowledgeList'
import { mockKnowledgeCoverageOverviewRes } from '@/mock/modules/knowledge/coverageOverview'
import { mockVulnKnowledgeOverviewRes } from '@/mock/modules/knowledge/vulnKnowledgeOverview'
import { getMockVulnItemExportResult } from '@/mock/modules/knowledge/vulnItemExport'
import { getMockVulnItemDetail, getMockVulnItemListPage } from '@/mock/modules/knowledge/vulnItemList'
import { getMockVulnItemOverview } from '@/mock/modules/knowledge/vulnItemOverview'
import { getMockVulnItemQuickSearchSuggestions } from '@/mock/modules/knowledge/vulnItemQuickSearch'
import {
  filterMockVulnSourceList,
  getMockVulnSyncAllPreview,
  mockImportOfflineVulnPackage,
  mockSyncAllVulnSources,
  mockSyncVulnSource,
} from '@/mock/modules/knowledge/vulnSourceList'
import {
  getMockKbVersionOverview,
  getMockKbVersions,
} from '@/mock/modules/knowledge/versionList'

// TODO: replace with: import request from '@/utils/request'

const DEFAULT_PAGE_SIZE = 10

function toDateKey(iso: string): string {
  return iso.slice(0, 10)
}

/** mock 阶段按筛选条件过滤知识库项目列表 */
function filterMockKbProjects(params: KbProjectQueryParams): KbProject[] {
  let list = [...MOCK_ALL_KB_PROJECTS]

  const projectName = params.projectName?.trim()
  if (projectName) {
    list = list.filter((item) => item.projectName.includes(projectName))
  }

  if (params.category) {
    list = list.filter((item) => item.category === params.category)
  }

  if (params.collectMode) {
    list = list.filter((item) => item.collectMode === params.collectMode)
  }

  if (params.updatedDate) {
    list = list.filter((item) => toDateKey(item.updatedAt) === params.updatedDate)
  }

  return list.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
}

/**
 * 获取知识库开源项目列表（分页 + 筛选）
 * @param params - 分页与筛选参数
 */
export function getKbProjectList(
  params: KbProjectQueryParams,
): Promise<ApiResponse<PageResult<KbProject>>> {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE

  const sorted = filterMockKbProjects(params)
  const start = (page - 1) * pageSize
  const list = sorted.slice(start, start + pageSize)

  // TODO: replace with → return request.get('/api/knowledge/projects', { params })
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
 * 更新知识库开源项目基本信息
 * @param kbProjectId - 项目 ID
 * @param data - 可编辑字段
 */
export function updateKbProject(
  kbProjectId: string,
  data: UpdateKbProjectParams,
): Promise<ApiResponse<KbProject>> {
  const index = MOCK_ALL_KB_PROJECTS.findIndex((item) => item.kbProjectId === kbProjectId)
  if (index < 0) {
    return Promise.reject(new Error('开源项目不存在'))
  }

  const projectName = data.projectName.trim()
  if (!projectName) {
    return Promise.reject(new Error('项目名称不能为空'))
  }
  if (!data.category) {
    return Promise.reject(new Error('分类不能为空'))
  }
  if (!data.collectMode) {
    return Promise.reject(new Error('采集方式不能为空'))
  }

  const updated: KbProject = {
    ...MOCK_ALL_KB_PROJECTS[index],
    projectName,
    category: data.category,
    collectMode: data.collectMode,
    tags: data.tags?.trim() || undefined,
    updatedAt: new Date().toISOString(),
  }

  MOCK_ALL_KB_PROJECTS[index] = updated

  // TODO: replace with → return request.put(`/api/knowledge/projects/${kbProjectId}`, data)
  return Promise.resolve({ code: 200, message: 'ok', data: updated })
}

/**
 * 获取知识库开源项目详情
 * @param kbProjectId - 项目 ID
 */
export function getKbProjectDetail(
  kbProjectId: string,
): Promise<ApiResponse<KbProject>> {
  const project = MOCK_ALL_KB_PROJECTS.find((item) => item.kbProjectId === kbProjectId)
  if (!project) {
    return Promise.reject(new Error('开源项目不存在'))
  }

  // TODO: replace with → return request.get(`/api/knowledge/projects/${kbProjectId}`)
  return Promise.resolve({ code: 200, message: 'ok', data: project })
}

/**
 * 获取知识库版本管理页概览（统计卡片）
 * @param kbProjectId - 项目 ID
 */
export function getKbVersionOverview(
  kbProjectId: string,
): Promise<ApiResponse<KbVersionOverview>> {
  const overview = getMockKbVersionOverview(kbProjectId)
  if (!overview) {
    return Promise.reject(new Error('开源项目不存在'))
  }

  // TODO: replace with → return request.get(`/api/knowledge/projects/${kbProjectId}/version-overview`)
  return Promise.resolve({ code: 200, message: 'ok', data: overview })
}

/**
 * 获取知识库项目版本列表（分页）
 * @param kbProjectId - 项目 ID
 * @param params - 分页参数
 */
export function getKbVersionList(
  kbProjectId: string,
  params: Omit<KbVersionQueryParams, 'kbProjectId'>,
): Promise<ApiResponse<PageResult<KbVersion>>> {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE

  const sorted = getMockKbVersions(kbProjectId).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
  const start = (page - 1) * pageSize
  const list = sorted.slice(start, start + pageSize)

  // TODO: replace with → return request.get(`/api/knowledge/projects/${kbProjectId}/versions`, { params })
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
 * 获取知识库覆盖统计页概览
 */
export function getKnowledgeCoverageOverview(): Promise<
  ApiResponse<KnowledgeCoverageOverview>
> {
  // TODO: replace with → return request.get('/api/knowledge/coverage/overview')
  return Promise.resolve(mockKnowledgeCoverageOverviewRes)
}

/**
 * 获取漏洞知识库页概览
 */
export function getVulnKnowledgeOverview(): Promise<ApiResponse<VulnKnowledgeOverview>> {
  // TODO: replace with → return request.get('/api/knowledge/vulnerabilities/overview')
  return Promise.resolve(mockVulnKnowledgeOverviewRes)
}

/**
 * 获取漏洞来源列表（分页 + 筛选）
 * @param params - 来源、同步状态、关键词、分页
 */
export function getVulnSourceList(
  params: VulnSourceQueryParams,
): Promise<ApiResponse<PageResult<VulnSource>>> {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE

  const sorted = filterMockVulnSourceList(params)
  const start = (page - 1) * pageSize
  const list = sorted.slice(start, start + pageSize)

  // TODO: replace with → return request.get('/api/knowledge/vulnerabilities/sources', { params })
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
 * 获取漏洞条目页快捷检索建议
 */
export function getVulnItemQuickSearchSuggestions(): Promise<
  ApiResponse<VulnItemQuickSearchSuggestion[]>
> {
  // TODO: replace with → return request.get('/api/knowledge/vulnerabilities/items/quick-search-suggestions')
  return Promise.resolve({
    code: 200,
    message: 'ok',
    data: getMockVulnItemQuickSearchSuggestions(),
  })
}

/**
 * 获取漏洞条目页概览（与列表共用筛选参数）
 * @param params - 关键词、来源、等级、编号等筛选条件
 */
export function getVulnItemOverview(
  params: VulnItemOverviewQueryParams = {},
): Promise<ApiResponse<VulnItemOverview>> {
  // TODO: replace with → return request.get('/api/knowledge/vulnerabilities/items/overview', { params })
  return Promise.resolve({
    code: 200,
    message: 'ok',
    data: getMockVulnItemOverview(params),
  })
}

/**
 * 获取漏洞条目列表（分页 + 筛选）
 * @param params - 分页与筛选参数
 */
export function getVulnItemList(
  params: VulnItemListQueryParams,
): Promise<ApiResponse<PageResult<VulnItemListItem>>> {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE
  const { list, total } = getMockVulnItemListPage({ ...params, page, pageSize })

  // TODO: replace with → return request.get('/api/knowledge/vulnerabilities/items', { params })
  return Promise.resolve({
    code: 200,
    message: 'ok',
    data: {
      list,
      total,
      page,
      pageSize,
    },
  })
}

/**
 * 导出漏洞条目检索结果
 * @param params - 筛选条件、导出格式与范围
 */
export function exportVulnItems(
  params: VulnItemExportParams,
): Promise<ApiResponse<VulnItemExportResult>> {
  // TODO: replace with → return request.post('/api/knowledge/vulnerabilities/items/export', params)
  return Promise.resolve({
    code: 200,
    message: 'ok',
    data: getMockVulnItemExportResult(params),
  })
}

/**
 * 获取漏洞条目详情
 * @param itemId - 条目 ID
 */
export function getVulnItemDetail(itemId: string): Promise<ApiResponse<VulnItemDetail>> {
  const detail = getMockVulnItemDetail(itemId)
  if (!detail) {
    return Promise.reject(new Error('漏洞条目不存在'))
  }

  // TODO: replace with → return request.get(`/api/knowledge/vulnerabilities/items/${itemId}`)
  return Promise.resolve({
    code: 200,
    message: 'ok',
    data: detail,
  })
}

/**
 * 获取全库同步弹窗预览（来源名列表与预计耗时）
 */
export function getVulnSyncAllPreview(): Promise<ApiResponse<VulnSyncAllPreview>> {
  // TODO: replace with → return request.get('/api/knowledge/vulnerabilities/sources/sync-all/preview')
  return Promise.resolve({
    code: 200,
    message: 'ok',
    data: getMockVulnSyncAllPreview(),
  })
}

/**
 * 对全部内置漏洞来源执行增量同步
 */
export function syncAllVulnSources(): Promise<ApiResponse<null>> {
  // TODO: replace with → return request.post('/api/knowledge/vulnerabilities/sources/sync-all')
  mockSyncAllVulnSources()
  return Promise.resolve({ code: 200, message: 'ok', data: null })
}

/**
 * 导入离线漏洞包
 * @param params - 来源标签与漏洞包文件
 */
export function importOfflineVulnPackage(
  params: ImportOfflineVulnPackageParams,
): Promise<ApiResponse<VulnSource>> {
  const sourceTag = params.sourceTag.trim()
  if (!sourceTag) {
    return Promise.reject(new Error('请输入来源标签'))
  }

  // TODO: replace with FormData → request.post('/api/knowledge/vulnerabilities/sources/import-offline', formData)
  return Promise.resolve({
    code: 200,
    message: 'ok',
    data: mockImportOfflineVulnPackage(params),
  })
}

/**
 * 立即同步指定漏洞来源
 * @param params - 来源 ID 与编码信息
 */
export function syncVulnSource(params: SyncVulnSourceParams): Promise<ApiResponse<VulnSource>> {
  // TODO: replace with → return request.post(`/api/knowledge/vulnerabilities/sources/${params.sourceId}/sync`, params)
  return Promise.resolve({
    code: 200,
    message: 'ok',
    data: mockSyncVulnSource(params),
  })
}

/**
 * 删除知识库开源项目
 * @param kbProjectId - 项目 ID
 */
export function deleteKbProject(kbProjectId: string): Promise<ApiResponse<null>> {
  const index = MOCK_ALL_KB_PROJECTS.findIndex((item) => item.kbProjectId === kbProjectId)
  if (index >= 0) {
    MOCK_ALL_KB_PROJECTS.splice(index, 1)
  }

  // TODO: replace with → return request.delete(`/api/knowledge/projects/${kbProjectId}`)
  return Promise.resolve({ code: 200, message: 'ok', data: null })
}
