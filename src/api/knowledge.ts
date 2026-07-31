import request from '@/utils/request'
import type { ApiResponse, PageResult } from '@/types/common'
import {
  buildCreateKbProjectFormData,
  buildImportOfflineVulnPackageFormData,
  buildUploadKbVersionPackageFormData,
} from '@/utils/formDataBuilders'
import type { FileTreeData } from '@/types/fileTree'
import type {
  KbProject,
  KbProjectDirectoryQueryParams,
  KbProjectFileDetail,
  KbProjectFileDetailQueryParams,
  KbProjectFileMetadataExportParams,
  KbProjectFileMetadataExportResult,
  KbIntakeTodoItem,
  KbIntakeTodoQueryParams,
  KbProjectOverview,
  KbProjectQueryParams,
  CategoryCoverageStat,
  CollectionMethodCoverageStat,
  CoveragePendingItem,
  CoveragePendingQueryParams,
  CoverageUpdateTrendWeek,
  CreateKbProjectParams,
  CreateKbProjectResult,
  KnowledgeCoverageOverview,
  KbQuarterUpdateOverview,
  KbQuarterUpdateListQueryParams,
  KbQuarterUpdateRecord,
  FetchKbVersionUpdateResult,
  KbVersion,
  KbVersionOverview,
  KbVersionQueryParams,
  KbVersionSelectOption,
  RestoreKbVersionParams,
  UploadKbVersionPackageParams,
  UploadKbVersionPackageResult,
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
  VulnRiskSummary,
  VulnSource,
  VulnSourceQueryParams,
  VulnSyncAllPreview,
} from '@/types/knowledge'
import {
  normalizeCategoryCoverageStats,
  normalizeCollectionMethodCoverageStats,
  normalizeCoveragePendingPage,
  normalizeCoverageUpdateTrendWeeks,
  normalizeCreateKbProjectResult,
  normalizeFetchKbVersionUpdateResult,
  normalizeImportedVulnSource,
  normalizeKbIntakeTodoPage,
  normalizeKbProject,
  normalizeKbProjectDirectoryTree,
  normalizeKbProjectFileDetail,
  normalizeKbProjectOverview,
  normalizeKbProjectPage,
  normalizeKbQuarterUpdateOverview,
  normalizeKbQuarterUpdatePage,
  normalizeKbQuarterUpdateQuarterOptions,
  normalizeKbVersionOverview,
  normalizeKbVersionPage,
  normalizeKbVersionSelectOptions,
  normalizeKnowledgeCoverageOverview,
  normalizeKnowledgeDownloadResult,
  normalizeSyncedVulnSource,
  normalizeUpdatedKbProject,
  normalizeUploadKbVersionPackageResult,
  normalizeVulnItemDetail,
  normalizeVulnItemOverview,
  normalizeVulnItemPage,
  normalizeVulnItemQuickSearchSuggestions,
  normalizeVulnKnowledgeOverview,
  normalizeVulnRiskSummary,
  normalizeVulnSourcePage,
  normalizeVulnSyncAllPreview,
  toKnowledgeQueryParams,
  updateKbProjectParamsToApi,
  vulnItemExportParamsToApi,
  vulnSourceQueryParamsToApi,
} from '@/utils/knowledgeAdapter'

/**
 * 获取知识库开源项目列表（分页 + 筛选）
 * @param params - 分页与筛选参数
 */
export async function getKbProjectList(
  params: KbProjectQueryParams,
): Promise<ApiResponse<PageResult<KbProject>>> {
  const res = await request.get<ApiResponse<unknown>>('/api/knowledge/projects', {
    params: toKnowledgeQueryParams({ ...params }),
  })
  return { ...res, data: normalizeKbProjectPage(res.data) }
}

/**
 * 获取知识库管理页顶部概览（入库总数与各分类计数）
 */
export async function getKbProjectOverview(): Promise<ApiResponse<KbProjectOverview>> {
  const res = await request.get<ApiResponse<unknown>>('/api/knowledge/projects/overview')
  return { ...res, data: normalizeKbProjectOverview(res.data) }
}

/**
 * 获取知识库管理页入库待办列表（分页）
 * @param params - 分页参数
 */
export async function getKbIntakeTodoList(
  params: KbIntakeTodoQueryParams,
): Promise<ApiResponse<PageResult<KbIntakeTodoItem>>> {
  const res = await request.get<ApiResponse<unknown>>('/api/knowledge/projects/intake-todos', {
    params: toKnowledgeQueryParams({ ...params }),
  })
  return { ...res, data: normalizeKbIntakeTodoPage(res.data) }
}

/**
 * 添加开源项目（仓库拉取或上传源码包；后端异步处理，前端不刷新列表）
 * @param params - 项目名称、分类、入库方式与凭据或压缩包等
 */
export async function createKbProject(
  params: CreateKbProjectParams,
): Promise<ApiResponse<CreateKbProjectResult>> {
  const name = params.projectName.trim()
  if (!name) {
    return Promise.reject(new Error('项目名称不能为空'))
  }

  const formData = buildCreateKbProjectFormData({ ...params, projectName: name })
  const res = await request.post<ApiResponse<unknown>>('/api/knowledge/projects', formData)
  return { ...res, data: normalizeCreateKbProjectResult(res.data) }
}

/**
 * 更新知识库开源项目基本信息
 * @param kbProjectId - 项目 ID
 * @param data - 可编辑字段
 */
export async function updateKbProject(
  kbProjectId: string,
  data: UpdateKbProjectParams,
): Promise<ApiResponse<KbProject>> {
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

  const submitted: UpdateKbProjectParams = {
    ...data,
    projectName,
    tags: data.tags?.trim() || undefined,
  }
  const res = await request.put<ApiResponse<unknown>>(
    `/api/knowledge/projects/${kbProjectId}`,
    updateKbProjectParamsToApi(submitted),
  )
  return { ...res, data: normalizeUpdatedKbProject(res.data, kbProjectId, submitted) }
}

/**
 * 获取指定知识库项目的全部版本下拉选项（项目目录页切换版本）
 * @param kbProjectId - 知识库项目 ID
 */
export async function getKbVersionSelectOptions(
  kbProjectId: string,
): Promise<ApiResponse<KbVersionSelectOption[]>> {
  const res = await request.get<ApiResponse<unknown>>(
    `/api/knowledge/projects/${kbProjectId}/version-select-options`,
  )
  return { ...res, data: normalizeKbVersionSelectOptions(res.data) }
}

/**
 * 获取知识库项目目录树（Linux 风格树形结构）
 * @param params - 项目 ID、版本 ID、关键字筛选
 */
export async function getKbProjectDirectoryTree(
  params: KbProjectDirectoryQueryParams,
): Promise<ApiResponse<FileTreeData>> {
  if (!params.kbProjectId) {
    return Promise.reject(new Error('项目 ID 不能为空'))
  }
  if (!params.versionId) {
    return Promise.reject(new Error('版本 ID 不能为空'))
  }

  const res = await request.get<ApiResponse<unknown>>(
    `/api/knowledge/projects/${params.kbProjectId}/versions/${params.versionId}/directory`,
    { params: toKnowledgeQueryParams({ keyword: params.keyword }) },
  )
  return { ...res, data: normalizeKbProjectDirectoryTree(res.data) }
}

/**
 * 获取知识库项目目录中单个文件的详情
 * @param params - 项目 ID、版本 ID、文件节点 ID
 */
export async function getKbProjectFileDetail(
  params: KbProjectFileDetailQueryParams,
): Promise<ApiResponse<KbProjectFileDetail>> {
  if (!params.kbProjectId || !params.versionId || !params.fileNodeId) {
    return Promise.reject(new Error('文件详情参数不完整'))
  }

  const res = await request.get<ApiResponse<unknown>>(
    `/api/knowledge/projects/${params.kbProjectId}/versions/${params.versionId}/directory/files/${params.fileNodeId}`,
  )
  return { ...res, data: normalizeKbProjectFileDetail(res.data) }
}

/**
 * 导出知识库项目目录文件元数据（获取下载链接）
 * @param params - 项目 ID、版本 ID、文件节点 ID
 */
export async function exportKbProjectFileMetadata(
  params: KbProjectFileMetadataExportParams,
): Promise<ApiResponse<KbProjectFileMetadataExportResult>> {
  if (!params.kbProjectId || !params.versionId || !params.fileNodeId) {
    return Promise.reject(new Error('导出参数不完整'))
  }

  const res = await request.post<ApiResponse<unknown>>(
    `/api/knowledge/projects/${params.kbProjectId}/versions/${params.versionId}/directory/files/${params.fileNodeId}/export-metadata`,
  )
  return { ...res, data: normalizeKnowledgeDownloadResult(res.data) }
}

/**
 * 获取知识库开源项目详情
 * @param kbProjectId - 项目 ID
 */
export async function getKbProjectDetail(
  kbProjectId: string,
): Promise<ApiResponse<KbProject>> {
  const res = await request.get<ApiResponse<unknown>>(`/api/knowledge/projects/${kbProjectId}`)
  const project = normalizeKbProject(res.data as Record<string, unknown>)
  return {
    ...res,
    data: { ...project, kbProjectId: project.kbProjectId || kbProjectId },
  }
}

/**
 * 获取知识库版本管理页概览（统计卡片）
 * @param kbProjectId - 项目 ID
 */
export async function getKbVersionOverview(
  kbProjectId: string,
): Promise<ApiResponse<KbVersionOverview>> {
  const res = await request.get<ApiResponse<unknown>>(
    `/api/knowledge/projects/${kbProjectId}/version-overview`,
  )
  const overview = normalizeKbVersionOverview(res.data)
  return {
    ...res,
    data: { ...overview, kbProjectId: overview.kbProjectId || kbProjectId },
  }
}

/**
 * 获取知识库项目版本列表（分页）
 * @param kbProjectId - 项目 ID
 * @param params - 分页参数
 */
export async function getKbVersionList(
  kbProjectId: string,
  params: Omit<KbVersionQueryParams, 'kbProjectId'>,
): Promise<ApiResponse<PageResult<KbVersion>>> {
  const res = await request.get<ApiResponse<unknown>>(
    `/api/knowledge/projects/${kbProjectId}/versions`,
    { params: toKnowledgeQueryParams({ ...params }) },
  )
  return { ...res, data: normalizeKbVersionPage(res.data, kbProjectId) }
}

/**
 * 获取版本更新（从云端拉取差异）
 * @param kbProjectId - 知识库项目 ID
 */
export async function fetchKbVersionUpdate(
  kbProjectId: string,
): Promise<ApiResponse<FetchKbVersionUpdateResult>> {
  const res = await request.post<ApiResponse<unknown>>(
    `/api/knowledge/projects/${kbProjectId}/versions/fetch-update`,
  )
  return { ...res, data: normalizeFetchKbVersionUpdateResult(res.data) }
}

/**
 * 恢复已归档的知识库版本（重新激活）
 * @param params - 项目 ID、版本 ID
 */
export function restoreKbVersion(
  params: RestoreKbVersionParams,
): Promise<ApiResponse<null>> {
  return request.post(
    `/api/knowledge/projects/${params.kbProjectId}/versions/${params.versionId}/restore`,
  )
}

/**
 * 上传版本更新包（后端异步处理，前端不刷新列表）
 * @param kbProjectId - 知识库项目 ID
 * @param params - 更新包文件
 */
export async function uploadKbVersionPackage(
  kbProjectId: string,
  params: UploadKbVersionPackageParams,
): Promise<ApiResponse<UploadKbVersionPackageResult>> {
  const formData = buildUploadKbVersionPackageFormData(params)
  const res = await request.post<ApiResponse<unknown>>(
    `/api/knowledge/projects/${kbProjectId}/versions/upload-package`,
    formData,
  )
  return { ...res, data: normalizeUploadKbVersionPackageResult(res.data) }
}

/**
 * 获取知识库覆盖统计页概览
 */
export async function getKnowledgeCoverageOverview(): Promise<
  ApiResponse<KnowledgeCoverageOverview>
> {
  const res = await request.get<ApiResponse<unknown>>('/api/knowledge/coverage/overview')
  return { ...res, data: normalizeKnowledgeCoverageOverview(res.data) }
}

/**
 * 获取季度更新管理页概览
 */
export async function getKbQuarterUpdateOverview(): Promise<
  ApiResponse<KbQuarterUpdateOverview>
> {
  const res = await request.get<ApiResponse<unknown>>('/api/knowledge/quarter-updates/overview')
  return { ...res, data: normalizeKbQuarterUpdateOverview(res.data) }
}

/**
 * 获取季度更新记录已有季度下拉选项
 */
export async function getKbQuarterUpdateQuarterOptions(): Promise<ApiResponse<string[]>> {
  const res = await request.get<ApiResponse<unknown>>('/api/knowledge/quarter-updates/quarters')
  return { ...res, data: normalizeKbQuarterUpdateQuarterOptions(res.data) }
}

/**
 * 分页获取季度更新记录列表
 * @param params - 季度、状态、采集方式、摘要关键词及分页
 */
export async function getKbQuarterUpdateList(
  params: KbQuarterUpdateListQueryParams,
): Promise<ApiResponse<PageResult<KbQuarterUpdateRecord>>> {
  const res = await request.get<ApiResponse<unknown>>('/api/knowledge/quarter-updates/records', {
    params: toKnowledgeQueryParams({ ...params }),
  })
  return { ...res, data: normalizeKbQuarterUpdatePage(res.data) }
}

/**
 * 获取分类覆盖统计列表（无分页）
 */
export async function getCategoryCoverageStats(): Promise<ApiResponse<CategoryCoverageStat[]>> {
  const res = await request.get<ApiResponse<unknown>>('/api/knowledge/coverage/category-stats')
  return { ...res, data: normalizeCategoryCoverageStats(res.data) }
}

/**
 * 获取采集方式覆盖统计列表（无分页）
 */
export async function getCollectionMethodCoverageStats(): Promise<
  ApiResponse<CollectionMethodCoverageStat[]>
> {
  const res = await request.get<ApiResponse<unknown>>(
    '/api/knowledge/coverage/collection-method-stats',
  )
  return { ...res, data: normalizeCollectionMethodCoverageStats(res.data) }
}

/**
 * 获取待补全清单（分页）
 * @param params - 分页参数，默认每页 5 条
 */
export async function getCoveragePendingList(
  params: CoveragePendingQueryParams,
): Promise<ApiResponse<PageResult<CoveragePendingItem>>> {
  const res = await request.get<ApiResponse<unknown>>('/api/knowledge/coverage/pending-items', {
    params: toKnowledgeQueryParams({ ...params }),
  })
  return { ...res, data: normalizeCoveragePendingPage(res.data) }
}

/**
 * 获取最近三周更新趋势列表
 */
export async function getCoverageUpdateTrendWeeks(): Promise<
  ApiResponse<CoverageUpdateTrendWeek[]>
> {
  const res = await request.get<ApiResponse<unknown>>(
    '/api/knowledge/coverage/update-trend/weeks',
  )
  return { ...res, data: normalizeCoverageUpdateTrendWeeks(res.data) }
}

/**
 * 获取漏洞知识库页概览
 */
export async function getVulnKnowledgeOverview(): Promise<ApiResponse<VulnKnowledgeOverview>> {
  const res = await request.get<ApiResponse<unknown>>('/api/knowledge/vulnerabilities/overview')
  return { ...res, data: normalizeVulnKnowledgeOverview(res.data) }
}

/** 获取漏洞知识库风险摘要图表数据 */
export async function getVulnRiskSummary(): Promise<ApiResponse<VulnRiskSummary>> {
  const res = await request.get<ApiResponse<unknown>>(
    '/api/knowledge/vulnerabilities/risk-summary',
  )
  return { ...res, data: normalizeVulnRiskSummary(res.data) }
}

/**
 * 获取漏洞来源列表（分页 + 筛选）
 * @param params - 来源、同步状态、关键词、分页
 */
export async function getVulnSourceList(
  params: VulnSourceQueryParams,
): Promise<ApiResponse<PageResult<VulnSource>>> {
  const res = await request.get<ApiResponse<unknown>>('/api/knowledge/vulnerabilities/sources', {
    params: vulnSourceQueryParamsToApi(params),
  })
  return { ...res, data: normalizeVulnSourcePage(res.data) }
}

/**
 * 获取漏洞条目页快捷检索建议
 */
export async function getVulnItemQuickSearchSuggestions(): Promise<
  ApiResponse<VulnItemQuickSearchSuggestion[]>
> {
  const res = await request.get<ApiResponse<unknown>>(
    '/api/knowledge/vulnerabilities/items/quick-search-suggestions',
  )
  return { ...res, data: normalizeVulnItemQuickSearchSuggestions(res.data) }
}

/**
 * 获取漏洞条目页概览（与列表共用筛选参数）
 * @param params - 关键词、来源、等级、编号等筛选条件
 */
export async function getVulnItemOverview(
  params: VulnItemOverviewQueryParams = {},
): Promise<ApiResponse<VulnItemOverview>> {
  const res = await request.get<ApiResponse<unknown>>(
    '/api/knowledge/vulnerabilities/items/overview',
    { params: toKnowledgeQueryParams({ ...params }) },
  )
  return { ...res, data: normalizeVulnItemOverview(res.data) }
}

/**
 * 获取漏洞条目列表（分页 + 筛选）
 * @param params - 分页与筛选参数
 */
export async function getVulnItemList(
  params: VulnItemListQueryParams,
): Promise<ApiResponse<PageResult<VulnItemListItem>>> {
  const res = await request.get<ApiResponse<unknown>>('/api/knowledge/vulnerabilities/items', {
    params: toKnowledgeQueryParams({ ...params }),
  })
  return { ...res, data: normalizeVulnItemPage(res.data) }
}

/**
 * 导出漏洞条目检索结果
 * @param params - 筛选条件、导出格式与范围
 */
export async function exportVulnItems(
  params: VulnItemExportParams,
): Promise<ApiResponse<VulnItemExportResult>> {
  const res = await request.post<ApiResponse<unknown>>(
    '/api/knowledge/vulnerabilities/items/export',
    vulnItemExportParamsToApi(params),
  )
  return { ...res, data: normalizeKnowledgeDownloadResult(res.data) }
}

/**
 * 获取漏洞条目详情
 * @param itemId - 条目 ID
 */
export async function getVulnItemDetail(itemId: string): Promise<ApiResponse<VulnItemDetail>> {
  const res = await request.get<ApiResponse<unknown>>(
    `/api/knowledge/vulnerabilities/items/${itemId}`,
  )
  return { ...res, data: normalizeVulnItemDetail(res.data, itemId) }
}

/**
 * 获取全库同步弹窗预览（来源名列表与预计耗时）
 */
export async function getVulnSyncAllPreview(): Promise<ApiResponse<VulnSyncAllPreview>> {
  const res = await request.get<ApiResponse<unknown>>(
    '/api/knowledge/vulnerabilities/sources/sync-all/preview',
  )
  return { ...res, data: normalizeVulnSyncAllPreview(res.data) }
}

/**
 * 对全部内置漏洞来源执行增量同步
 */
export function syncAllVulnSources(): Promise<ApiResponse<null>> {
  return request.post('/api/knowledge/vulnerabilities/sources/sync-all')
}

/**
 * 导入离线漏洞包
 * @param params - 来源标签与漏洞包文件
 */
export async function importOfflineVulnPackage(
  params: ImportOfflineVulnPackageParams,
): Promise<ApiResponse<VulnSource>> {
  const sourceTag = params.sourceTag.trim()
  if (!sourceTag) {
    return Promise.reject(new Error('请输入来源标签'))
  }

  const formData = buildImportOfflineVulnPackageFormData({ ...params, sourceTag })
  const res = await request.post<ApiResponse<unknown>>(
    '/api/knowledge/vulnerabilities/sources/import-offline',
    formData,
  )
  return { ...res, data: normalizeImportedVulnSource(res.data, sourceTag) }
}

/**
 * 立即同步指定漏洞来源
 * @param params - 来源 ID 与编码信息
 */
export async function syncVulnSource(
  params: SyncVulnSourceParams,
): Promise<ApiResponse<VulnSource>> {
  const res = await request.post<ApiResponse<unknown>>(
    `/api/knowledge/vulnerabilities/sources/${params.sourceId}/sync`,
    params,
  )
  return { ...res, data: normalizeSyncedVulnSource(res.data, params) }
}

/**
 * 删除知识库开源项目
 * @param kbProjectId - 项目 ID
 */
export function deleteKbProject(kbProjectId: string): Promise<ApiResponse<null>> {
  return request.delete(`/api/knowledge/projects/${kbProjectId}`)
}
