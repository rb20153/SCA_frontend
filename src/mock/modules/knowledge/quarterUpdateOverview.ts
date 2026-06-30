import type { ApiResponse } from '@/types/common'
import type { KbQuarterUpdateOverview } from '@/types/knowledge'

/** 季度更新管理页概览 mock */
export const mockKbQuarterUpdateOverviewRes: ApiResponse<KbQuarterUpdateOverview> = {
  code: 200,
  message: 'ok',
  data: {
    recentQuarter: '2026 Q2',
    newProjectCount: 12,
    uploadPackageCount: 5,
    cloudPullCount: 18,
  },
}
