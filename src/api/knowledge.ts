import type { ApiResponse, PageResult } from '@/types/common'
import type {
  KbProject,
  KbProjectQueryParams,
  KnowledgeCoverageOverview,
  KbVersion,
  KbVersionOverview,
  KbVersionQueryParams,
  UpdateKbProjectParams,
  SyncVulnSourceParams,
  VulnKnowledgeOverview,
  VulnSource,
  VulnSourceQueryParams,
} from '@/types/knowledge'
import { MOCK_ALL_KB_PROJECTS } from '@/mock/modules/knowledge/knowledgeList'
import { mockKnowledgeCoverageOverviewRes } from '@/mock/modules/knowledge/coverageOverview'
import { mockVulnKnowledgeOverviewRes } from '@/mock/modules/knowledge/vulnKnowledgeOverview'
import {
  filterMockVulnSourceList,
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
