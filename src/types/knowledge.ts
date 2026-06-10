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

export interface VulnSource {
  sourceId: string
  sourceCode: VulnSourceCode
  /** 来源展示名，如 NVD */
  sourceName: string
  /** 来源类型描述，如官方漏洞库 */
  sourceType: string
  description: string
  tags: string[]
  recordCount: number
  highRiskCount: number
  /** 同步周期文案，如「每日」 */
  syncCycle: string
  /** 最近同步时间，ISO 8601 */
  lastSyncedAt: string
  syncStatus: VulnSyncStatus
}

export interface VulnSourceListFilters {
  sourceCode: VulnSourceCode | ''
  syncStatus: VulnSyncStatus | ''
  keyword: string
}

export interface VulnSourceQueryParams extends PageParams {
  sourceCode?: VulnSourceCode
  syncStatus?: VulnSyncStatus
  keyword?: string
}

export interface SyncVulnSourceParams {
  sourceId: string
  sourceCode: VulnSourceCode
  sourceName: string
}
