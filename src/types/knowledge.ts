import type { PageParams } from '@/types/common'
import type { SourceIngestFormState } from '@/types/sourceIngest'
import type { Dayjs } from 'dayjs'

/** 开源项目分类 */
export type KbProjectCategory =
  | 'simulation_framework'
  | 'numerical_computing'
  | 'pre_post_processing'
  | 'general_dependency'

/** 采集 / 入库方式 */
export type KbCollectMode = 'cloud_repo' | 'upload_package'

export interface KbProject {
  kbProjectId: string
  projectName: string
  category: KbProjectCategory
  collectMode: KbCollectMode
  latestVersion: string
  versionCount: number
  /** 被引用项目数（列表「项目数」列） */
  referencedProjectCount: number
  /** 自定义标签，可选 */
  tags?: string
  /** 最近更新时间，ISO 8601 */
  updatedAt: string
}

export interface KbProjectListFilters {
  projectName: string
  category: KbProjectCategory | ''
  collectMode: KbCollectMode | ''
  updatedDate?: Dayjs
}

export interface KbProjectQueryParams extends PageParams {
  projectName?: string
  category?: KbProjectCategory
  collectMode?: KbCollectMode
  /** 最近更新日期，格式 YYYY-MM-DD */
  updatedDate?: string
}

/** 知识库管理页顶部概览（统计卡片） */
export interface KbProjectOverview {
  /** 入库项目总数 */
  totalCount: number
  /** 各分类入库数量 */
  categoryCounts: Record<KbProjectCategory, number>
}

/** 入库待办状态 */
export type KbIntakeTodoStatus = 'in_progress' | 'pending' | 'alert'

/** 知识库管理页 · 入库待办行 */
export interface KbIntakeTodoItem {
  todoId: string
  projectName: string
  status: KbIntakeTodoStatus
  /** 待办说明 / 详情 */
  detail: string
}

/** 入库待办列表查询参数 */
export interface KbIntakeTodoQueryParams extends PageParams {}

export interface UpdateKbProjectParams {
  projectName: string
  category: KbProjectCategory
  collectMode: KbCollectMode
  tags?: string
}

/** 添加开源项目请求 */
export interface CreateKbProjectParams extends SourceIngestFormState {
  projectName: string
  category: KbProjectCategory
  /** 上传源码包模式下的版本号 */
  packageVersion?: string
  tags?: string[]
  remark?: string
  packageFile?: File
}

/** 添加开源项目响应（后端异步处理） */
export interface CreateKbProjectResult {
  parseTaskId?: string
}

/** 知识库版本更新状态 */
export type KbVersionStatus = 'ready' | 'indexing' | 'archived'

export interface KbVersion {
  versionId: string
  kbProjectId: string
  versionNo: string
  description: string
  referencedProjectCount: number
  status: KbVersionStatus
  /** 创建时间，ISO 8601 */
  createdAt: string
  /** 索引构建任务 TraceID，status 为 indexing 时用于跳转日志页 */
  indexBuildTraceId?: string
  /** 更新说明正文，status 为 ready 时在弹窗展示 */
  updateNotes?: string
}

/** 恢复已归档版本请求参数 */
export interface RestoreKbVersionParams {
  kbProjectId: string
  versionId: string
}

/** 版本管理页顶部概览（统计卡片） */
export interface KbVersionOverview {
  kbProjectId: string
  projectName: string
  /** 当前基线版本号 */
  currentBaseline: string
  managedVersionCount: number
  referencedProjectCount: number
  /** 最近获取时间（最新版本创建时间），ISO 8601 */
  lastFetchedAt: string
}

export interface KbVersionQueryParams extends PageParams {
  kbProjectId: string
}

/** 项目目录页 · 版本下拉选项 */
export interface KbVersionSelectOption {
  versionId: string
  versionNo: string
}

/** 项目目录页筛选表单 */
export interface KbProjectDirectoryFilters {
  versionId: string
  keyword: string
}

/** 项目目录页查询参数（目录树 / 文件检索，后续对接） */
export interface KbProjectDirectoryQueryParams {
  kbProjectId: string
  versionId?: string
  keyword?: string
}

/** 项目目录 · 文件详情查询参数 */
export interface KbProjectFileDetailQueryParams {
  kbProjectId: string
  versionId: string
  fileNodeId: string
}

/** 项目目录 · 指纹与来源摘要表格行 */
export interface KbProjectFingerprintSummaryRow {
  rowId: string
  dimension: string
  hitCount: number
  maxConfidence: number
  description: string
}

/** 项目目录 · 单个文件详情 */
export interface KbProjectFileDetail {
  fileName: string
  path: string
  fileType: string
  sizeLabel: string
  md5: string
  sha1: string
  fingerprintSummary: string
  licenseClue: string
  /** 来源候选列表，展示时用分号连接 */
  sourceCandidates: string[]
  /** 最近更新时间，ISO 8601 */
  updatedAt: string
  /** 写入情况说明，如「由季度更新任务 KB-2026Q2-01 写入」 */
  writeContext: string
  fingerprintSummaries: KbProjectFingerprintSummaryRow[]
}

/** 项目目录 · 文件元数据导出参数 */
export interface KbProjectFileMetadataExportParams {
  kbProjectId: string
  versionId: string
  fileNodeId: string
}

/** 项目目录 · 文件元数据导出结果 */
export interface KbProjectFileMetadataExportResult {
  downloadUrl: string
  fileName: string
}

/** 获取版本更新（云端拉取）响应 */
export interface FetchKbVersionUpdateResult {
  /** 更新包大小（GB） */
  packageSizeGb: number
  /** 预计索引构建耗时（分钟） */
  estimatedMinutes: number
  /** 后端附加提示文案 */
  message: string
}

/** 上传版本更新包请求 */
export interface UploadKbVersionPackageParams {
  file: File
}

/** 上传版本更新包响应（后端异步处理） */
export interface UploadKbVersionPackageResult {
  parseTaskId?: string
}

/** 覆盖统计页顶部概览 */
export interface KnowledgeCoverageOverview {
  /** 项目覆盖率，0–100 */
  projectCoverageRate: number
  /** 目录索引完整率，0–100 */
  directoryIndexRate: number
  /** 漏洞源覆盖率，0–100 */
  vulnSourceCoverageRate: number
  /** 待补全项目数 */
  pendingProjectCount: number
}

/** 季度更新管理页顶部概览 */
export interface KbQuarterUpdateOverview {
  /** 最近季度，如「2026 Q2」 */
  recentQuarter: string
  /** 本季度新增项目数 */
  newProjectCount: number
  /** 本季度上传包数量 */
  uploadPackageCount: number
  /** 本季度云端拉取数量 */
  cloudPullCount: number
}

/** 季度更新记录状态 */
export type KbQuarterUpdateStatus = 'in_progress' | 'completed' | 'failed'

/** 季度更新记录列表项（系统自动写入的操作台账） */
export interface KbQuarterUpdateRecord {
  /** 后端更新记录 ID，供追溯同一次更新操作 */
  recordId: string
  projectName: string
  quarter: string
  collectMode: KbCollectMode
  status: KbQuarterUpdateStatus
  /** 操作发生时间，ISO 8601 */
  updatedAt: string
}

/** 季度更新记录列表筛选表单 */
export interface KbQuarterUpdateListFilters {
  quarter: string
  status: KbQuarterUpdateStatus | ''
  collectMode: KbCollectMode | ''
}

/** 季度更新记录列表查询参数 */
export interface KbQuarterUpdateListQueryParams extends PageParams {
  quarter?: string
  status?: KbQuarterUpdateStatus
  collectMode?: KbCollectMode
}

/** 分类覆盖统计行 */
export interface CategoryCoverageStat {
  category: string
  projectCount: number
  versionCount: number
  /** 目录覆盖率，0–100 */
  directoryCoverageRate: number
  /** 漏洞映射率，0–100 */
  vulnMappingRate: number
}

/** 采集方式覆盖统计行 */
export interface CollectionMethodCategoryCount {
  category: string
  projectCount: number
}

export interface CollectionMethodCoverageStat {
  method: string
  projectCount: number
  /** 各分类在该采集方式下的项目数，用于堆叠柱状图 */
  categoryCounts: CollectionMethodCategoryCount[]
  /** 成功率，0–100 */
  successRate: number
  /** 平均耗时（分钟） */
  avgDurationMinutes: number
  /** 具有真实采集耗时的样本数；0 表示暂无可计算数据 */
  durationSampleCount: number
}

/** 待补全项影响程度 */
export type CoverageGapImpact = 'low' | 'medium' | 'high'

/** 覆盖统计 · 待补全清单行 */
export interface CoveragePendingItem {
  pendingId: string
  projectName: string
  gapDescription: string
  impact: CoverageGapImpact
  suggestedAction: string
}

export interface CoveragePendingQueryParams extends PageParams {}

/** 覆盖统计 · 更新趋势周条目 */
export interface CoverageUpdateTrendWeek {
  /** 周次标签，如 W20 */
  weekLabel: string
  /** 新增开源项目数 */
  addedProjectCount: number
  /** 完成目录补全数量 */
  completedDirectoryCount: number
  /** 漏洞映射更新数量 */
  vulnMappingUpdateCount: number
  summary: string
}

/** 漏洞知识库页顶部概览 */
export interface VulnKnowledgeOverview {
  sourceCount: number
  totalVulnCount: number
  highRiskCount: number
  /** 最近同步时间，ISO 8601 */
  lastSyncedAt: string
}

/** 漏洞风险摘要三档数量 */
export interface VulnRiskLevelCount {
  high: number
  medium: number
  low: number
}

/** 漏洞风险摘要 · 来源维度 */
export interface VulnRiskSummarySource extends VulnRiskLevelCount {
  sourceName: string
  total: number
  /** 最近同步时间，ISO 8601 */
  lastSyncedAt: string
}

/** 漏洞知识库风险摘要 */
export interface VulnRiskSummary {
  total: number
  highRiskCount: number
  levelCounts: VulnRiskLevelCount
  sources: VulnRiskSummarySource[]
}

/** 漏洞来源编码 */
export type VulnSourceCode = 'nvd' | 'cnvd' | 'osv' | 'github_advisory'

/** 漏洞来源同步状态 */
export type VulnSyncStatus = 'normal' | 'delayed' | 'warning'

/** 漏洞来源种类：内置源 / 用户上传离线包 */
export type VulnSourceKind = 'builtin' | 'offline_upload'

export interface VulnSource {
  sourceId: string
  kind: VulnSourceKind
  /** 内置源编码；离线包为 null */
  sourceCode: VulnSourceCode | null
  /** 来源展示名，如 NVD；离线包为来源标签 */
  sourceName: string
  /** 来源类型描述，如官方漏洞库 / 上传离线包 */
  sourceType: string
  description?: string
  tags?: string[]
  /** 离线包为 null，列表展示 — */
  recordCount: number | null
  highRiskCount: number | null
  /** 同步周期文案；离线包为 null */
  syncCycle: string | null
  /** 最近同步 / 上传时间，ISO 8601 */
  lastSyncedAt: string
  syncStatus: VulnSyncStatus
}

/** 全库同步弹窗预览（打开弹窗时由后端返回） */
export interface VulnSyncAllPreview {
  sourceNames: string[]
  estimatedMinutes: number
}

export interface ImportOfflineVulnPackageParams {
  sourceTag: string
  file: File
}

export interface VulnSourceListFilters {
  /** 来源名称关键词 */
  sourceName: string
  syncStatus: VulnSyncStatus | ''
}

export interface VulnSourceQueryParams extends PageParams {
  sourceName?: string
  syncStatus?: VulnSyncStatus
}

export interface SyncVulnSourceParams {
  sourceId: string
  sourceCode: VulnSourceCode
  sourceName: string
}

/** 漏洞条目严重等级（列表 / 详情展示） */
export type VulnItemLevel = 'low' | 'medium' | 'high'

/** 漏洞条目处置状态 */
export type VulnItemStatus = 'synced' | 'needs_review' | 'pending_action'

export interface VulnItemListItem {
  itemId: string
  /** CVE / CNVD 等公开编号 */
  identifier: string
  sourceId: string
  sourceName: string
  level: VulnItemLevel
  affectedComponent: string
  /** 更新时间，ISO 8601 */
  updatedAt: string
  status: VulnItemStatus
}

export interface VulnItemDetail {
  itemId: string
  identifier: string
  sourceName: string
  level: VulnItemLevel
  cvssScore: number
  description: string
  affectedComponent: string
  fixedVersion: string
  /** 参考链接列表 */
  referenceLinks: VulnItemReferenceLink[]
}

/** 漏洞条目的参考链接（后端 references_json） */
export interface VulnItemReferenceLink {
  url: string
  type: string
}

export interface VulnItemListFilters {
  keyword: string
  sourceName: string
  /** 从来源列表跳转时携带，与 sourceName 二选一参与筛选 */
  sourceId: string
  level: VulnItemLevel | ''
  status: VulnItemStatus | ''
  /** CVE / CNVD 编号关键词 */
  identifier: string
}

export interface VulnItemListQueryParams extends PageParams {
  keyword?: string
  sourceName?: string
  sourceId?: string
  level?: VulnItemLevel
  status?: VulnItemStatus
  identifier?: string
}

/** 漏洞条目页概览查询（与列表筛选参数对齐） */
export type VulnItemOverviewQueryParams = Omit<VulnItemListQueryParams, 'page' | 'pageSize'>

/** 漏洞条目导出格式 */
export type VulnItemExportFormat = 'csv' | 'excel' | 'json'

/** 漏洞条目导出范围 */
export type VulnItemExportScope = 'filtered' | 'current_page'

export interface VulnItemExportParams extends VulnItemOverviewQueryParams {
  format: VulnItemExportFormat
  scope: VulnItemExportScope
  /** scope 为 current_page 时必填 */
  page?: number
  pageSize?: number
}

export interface VulnItemExportResult {
  downloadUrl: string
  fileName: string
}

/** 快捷检索建议中的筛选片段（未给出的字段视为清空） */
export interface VulnItemQuickSearchFilters {
  keyword?: string
  sourceName?: string
  sourceId?: string
  level?: VulnItemLevel | ''
  status?: VulnItemStatus | ''
  identifier?: string
}

/** 漏洞条目页快捷检索建议（由后端下发） */
export interface VulnItemQuickSearchSuggestion {
  suggestionId: string
  /** 完整说明（tooltip / 无障碍） */
  label: string
  /** 标签短文案；缺省时前端从 filters 推导 */
  shortLabel?: string
  filters: VulnItemQuickSearchFilters
}

/** 漏洞条目页统计卡片数据 */
export interface VulnItemOverview {
  totalCount: number
  matchedCount: number
  highRiskCount: number
  /** 最近更新时间，ISO 8601 */
  lastUpdatedAt: string
  /** 全库检索：跨来源重复条目数 */
  crossSourceDuplicateCount?: number
  /** 指定来源检索：当前来源名称 */
  activeSourceName?: string
}
