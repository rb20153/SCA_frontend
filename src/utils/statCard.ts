import type { StatCardItem } from '@/types/common'
import type { DashboardStatItem } from '@/types/dashboard'
import type { KnowledgeCoverageOverview, VulnKnowledgeOverview } from '@/types/knowledge'
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
