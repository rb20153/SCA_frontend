import type { ApiResponse } from '@/types/common'
import type { KnowledgeCoverageOverview } from '@/types/knowledge'

/** 覆盖统计页概览 mock */
export const mockKnowledgeCoverageOverviewRes: ApiResponse<KnowledgeCoverageOverview> = {
  code: 200,
  message: 'ok',
  data: {
    projectCoverageRate: 91.4,
    directoryIndexRate: 96.8,
    vulnSourceCoverageRate: 88.2,
    pendingProjectCount: 9,
  },
}
