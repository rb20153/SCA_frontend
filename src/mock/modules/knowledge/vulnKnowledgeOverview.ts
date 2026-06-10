import type { ApiResponse } from '@/types/common'
import type { VulnKnowledgeOverview } from '@/types/knowledge'

/** 漏洞知识库页概览 mock */
export const mockVulnKnowledgeOverviewRes: ApiResponse<VulnKnowledgeOverview> = {
  code: 200,
  message: 'ok',
  data: {
    sourceCount: 4,
    totalVulnCount: 8420,
    highRiskCount: 312,
    lastSyncedAt: '2026-05-28T23:40:00+08:00',
  },
}
