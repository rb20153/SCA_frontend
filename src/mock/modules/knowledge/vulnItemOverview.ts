import type { VulnItemOverview, VulnItemOverviewQueryParams } from '@/types/knowledge'
import { getMockVulnSourceById } from '@/mock/modules/knowledge/vulnSourceList'
import {
  countMockCrossSourceDuplicates,
  filterMockVulnItemList,
} from '@/mock/modules/knowledge/vulnItemList'

/**
 * 获取漏洞条目页概览 mock（与列表共用筛选条件）
 * @param params - 与列表一致的筛选参数
 */
export function getMockVulnItemOverview(params: VulnItemOverviewQueryParams): VulnItemOverview {
  const filtered = filterMockVulnItemList(params)
  const highRiskCount = filtered.filter((item) => item.level === 'high').length
  const lastUpdatedAt =
    filtered.length > 0
      ? filtered.reduce((latest, item) =>
          new Date(item.updatedAt).getTime() > new Date(latest).getTime() ? item.updatedAt : latest,
        filtered[0].updatedAt)
      : new Date().toISOString()

  if (params.sourceId) {
    const source = getMockVulnSourceById(params.sourceId)
    return {
      matchedCount: filtered.length,
      highRiskCount,
      lastUpdatedAt,
      activeSourceName: source?.sourceName ?? '未知来源',
    }
  }

  return {
    matchedCount: filtered.length,
    highRiskCount,
    lastUpdatedAt,
    crossSourceDuplicateCount: countMockCrossSourceDuplicates(filtered),
  }
}
