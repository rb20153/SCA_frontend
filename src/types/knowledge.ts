import type { PageParams } from '@/types/common'
import type { Dayjs } from 'dayjs'

/** 开源项目分类 */
export type KbProjectCategory = 'simulation_framework' | 'numerical_computing' | 'toolchain'

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

export interface UpdateKbProjectParams {
  projectName: string
  category: KbProjectCategory
  collectMode: KbCollectMode
  tags?: string
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

/** 漏洞知识库页顶部概览 */
export interface VulnKnowledgeOverview {
  sourceCount: number
  totalVulnCount: number
  highRiskCount: number
  /** 最近同步时间，ISO 8601 */
  lastSyncedAt: string
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
  referenceLinks: string[]
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
  matchedCount: number
  highRiskCount: number
  /** 最近更新时间，ISO 8601 */
  lastUpdatedAt: string
  /** 全库检索：跨来源重复条目数 */
  crossSourceDuplicateCount?: number
  /** 指定来源检索：当前来源名称 */
  activeSourceName?: string
}
