import type { ApiResponse } from '@/types/common'
import type { VulnRiskSummary } from '@/types/knowledge'

/** 漏洞知识库风险摘要 mock：总数与顶部概览 8,420 / 高危 312 对齐 */
export const mockVulnRiskSummaryRes: ApiResponse<VulnRiskSummary> = {
  code: 200,
  message: 'ok',
  data: {
    total: 8420,
    highRiskCount: 312,
    levelCounts: {
      high: 312,
      medium: 3344,
      low: 4764,
    },
    sources: [
      {
        sourceName: 'NVD',
        total: 4860,
        high: 188,
        medium: 2056,
        low: 2616,
        lastSyncedAt: '2026-05-28T23:40:00+08:00',
      },
      {
        sourceName: 'OSV',
        total: 1940,
        high: 46,
        medium: 720,
        low: 1174,
        lastSyncedAt: '2026-05-28T22:10:00+08:00',
      },
      {
        sourceName: 'CNVD',
        total: 1320,
        high: 54,
        medium: 456,
        low: 810,
        lastSyncedAt: '2026-05-28T20:30:00+08:00',
      },
      {
        sourceName: 'GitHub Advisory',
        total: 300,
        high: 24,
        medium: 112,
        low: 164,
        lastSyncedAt: '2026-05-26T23:40:00+08:00',
      },
    ],
  },
}
