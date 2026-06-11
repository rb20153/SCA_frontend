import type { VulnItemQuickSearchSuggestion } from '@/types/knowledge'

/** 漏洞条目快捷检索建议 mock（后端可按热度 / 策略动态生成） */
const MOCK_QUICK_SEARCH_SUGGESTIONS: VulnItemQuickSearchSuggestion[] = [
  {
    suggestionId: 'vqs-001',
    label: '在全部库中搜索 openssl 3.0.8，查看交叉来源',
    filters: {
      keyword: 'openssl 3.0.8',
    },
  },
  {
    suggestionId: 'vqs-002',
    label: '在 NVD 中搜索 CVE-2024-3094，查看官方描述',
    filters: {
      sourceName: 'NVD',
      identifier: 'CVE-2024-3094',
    },
  },
  {
    suggestionId: 'vqs-003',
    label: '在 OSV 中搜索 protobuf，查看开源生态安全公告',
    filters: {
      sourceName: 'OSV',
      keyword: 'protobuf',
    },
  },
  {
    suggestionId: 'vqs-004',
    label: '查看待处置的高危条目',
    filters: {
      level: 'high',
      status: 'pending_action',
    },
  },
]

/**
 * 获取漏洞条目页快捷检索建议 mock
 * @returns 建议列表，顺序由后端策略决定
 */
export function getMockVulnItemQuickSearchSuggestions(): VulnItemQuickSearchSuggestion[] {
  return MOCK_QUICK_SEARCH_SUGGESTIONS.map((item) => ({
    ...item,
    filters: { ...item.filters },
  }))
}
