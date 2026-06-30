import type { StatCardItem } from '@/types/common'
import type { DashboardStatItem } from '@/types/dashboard'
import type {
  KnowledgeCoverageOverview,
  KbProjectOverview,
  KbQuarterUpdateOverview,
  VulnItemOverview,
  VulnKnowledgeOverview,
} from '@/types/knowledge'
import { KB_PROJECT_CATEGORY_LABEL } from '@/utils/knowledgeDisplay'
import type { AlertCenterOverview } from '@/types/system'
import dayjs from 'dayjs'

/**
 * 将首页概览统计项转为通用 StatCardItem
 * @param items - 首页 dashboard overview 返回的 stats
 */
export function mapDashboardStatsToStatCards(items: DashboardStatItem[]): StatCardItem[] {
  return items.map((item) => ({
    key: item.key,
    label: item.label,
    value: `${item.value}${item.suffix ?? ''}`,
    growth: item.growth,
    growthSuffix: item.growthSuffix,
    warnValue: item.warnValue,
  }))
}

const KB_PROJECT_OVERVIEW_CATEGORY_ORDER = [
  'simulation_framework',
  'numerical_computing',
  'pre_post_processing',
  'general_dependency',
] as const

/**
 * 将知识库管理页概览转为 StatCardItem 列表（入库总数 + 四类分类计数）
 * @param overview - 知识库管理 overview API 返回数据
 */
export function mapKbProjectOverviewToStatCards(overview: KbProjectOverview): StatCardItem[] {
  const categoryCards = KB_PROJECT_OVERVIEW_CATEGORY_ORDER.map((key) => ({
    key,
    label: KB_PROJECT_CATEGORY_LABEL[key],
    value: String(overview.categoryCounts[key]),
  }))

  return [
    {
      key: 'totalCount',
      label: '入库总数',
      value: String(overview.totalCount),
    },
    ...categoryCards,
  ]
}

/**
 * 将覆盖统计概览转为 StatCardItem 列表
 * @param overview - 覆盖统计 API 返回数据
 */
export function mapKnowledgeCoverageToStatCards(
  overview: KnowledgeCoverageOverview,
): StatCardItem[] {
  return [
    {
      key: 'projectCoverageRate',
      label: '项目覆盖率',
      value: `${overview.projectCoverageRate}%`,
    },
    {
      key: 'directoryIndexRate',
      label: '目录索引完整率',
      value: `${overview.directoryIndexRate}%`,
    },
    {
      key: 'vulnSourceCoverageRate',
      label: '漏洞源覆盖率',
      value: `${overview.vulnSourceCoverageRate}%`,
    },
    {
      key: 'pendingProjectCount',
      label: '待补全项目',
      value: String(overview.pendingProjectCount),
      warnValue: overview.pendingProjectCount > 0,
    },
  ]
}

/**
 * 将季度更新管理页概览转为 StatCardItem 列表
 * @param overview - 季度更新 overview API 返回数据
 */
export function mapKbQuarterUpdateToStatCards(overview: KbQuarterUpdateOverview): StatCardItem[] {
  return [
    {
      key: 'recentQuarter',
      label: '最近季度',
      value: overview.recentQuarter,
    },
    {
      key: 'newProjectCount',
      label: '新增项目',
      value: String(overview.newProjectCount),
    },
    {
      key: 'uploadPackageCount',
      label: '上传包',
      value: String(overview.uploadPackageCount),
    },
    {
      key: 'cloudPullCount',
      label: '云端拉取',
      value: String(overview.cloudPullCount),
    },
  ]
}

/**
 * 将漏洞知识库概览转为 StatCardItem 列表
 * @param overview - 漏洞知识库 API 返回数据
 */
export function mapVulnKnowledgeToStatCards(overview: VulnKnowledgeOverview): StatCardItem[] {
  const syncedAt = dayjs(overview.lastSyncedAt)

  return [
    {
      key: 'sourceCount',
      label: '来源数',
      value: String(overview.sourceCount),
    },
    {
      key: 'totalVulnCount',
      label: '漏洞总数',
      value: overview.totalVulnCount.toLocaleString('zh-CN'),
      linkLabel: '查看漏洞条目',
      linkTo: '/knowledge/vulnerabilities/items',
    },
    {
      key: 'highRiskCount',
      label: '高危漏洞',
      value: overview.highRiskCount.toLocaleString('zh-CN'),
      warnValue: overview.highRiskCount > 0,
    },
    {
      key: 'lastSyncedAt',
      label: '最近同步',
      value: syncedAt.isValid() ? syncedAt.format('YYYY-MM-DD HH:mm') : '—',
    },
  ]
}

/**
 * 将漏洞条目页概览转为 StatCardItem 列表
 * @param overview - 条目 overview API 返回；有 activeSourceName 时第二格展示「来源」
 */
export function mapVulnItemToStatCards(overview: VulnItemOverview): StatCardItem[] {
  const lastUpdated = dayjs(overview.lastUpdatedAt)
  const contextCard: StatCardItem = overview.activeSourceName
    ? {
        key: 'activeSource',
        label: '来源',
        value: overview.activeSourceName,
      }
    : {
        key: 'crossSourceDuplicate',
        label: '跨库重复',
        value: String(overview.crossSourceDuplicateCount ?? 0),
      }

  return [
    {
      key: 'matchedCount',
      label: '命中条目',
      value: overview.matchedCount.toLocaleString('zh-CN'),
    },
    contextCard,
    {
      key: 'highRiskCount',
      label: '高危',
      value: overview.highRiskCount.toLocaleString('zh-CN'),
      warnValue: overview.highRiskCount > 0,
    },
    {
      key: 'lastUpdatedAt',
      label: '最近更新',
      value: lastUpdated.isValid() ? lastUpdated.format('YYYY-MM-DD HH:mm') : '—',
    },
  ]
}

/**
 * 将告警中心概览转为 StatCardItem 列表
 * @param overview - 告警中心 API 返回数据
 */
export function mapAlertCenterToStatCards(overview: AlertCenterOverview): StatCardItem[] {
  const totalCount =
    overview.criticalCount + overview.importantCount + overview.normalCount

  return [
    {
      key: 'totalCount',
      label: '全部告警',
      value: String(totalCount),
    },
    {
      key: 'criticalCount',
      label: '紧急',
      value: String(overview.criticalCount),
      warnValue: overview.criticalCount > 0,
    },
    {
      key: 'importantCount',
      label: '重要',
      value: String(overview.importantCount),
      warnValue: overview.importantCount > 0,
    },
    {
      key: 'normalCount',
      label: '一般',
      value: String(overview.normalCount),
    },
  ]
}
