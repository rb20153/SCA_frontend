import type { ApiResponse } from '@/types/common'
import type { DashboardOverview } from '@/types/dashboard'

/** 首页顶部 4 项统计卡片 mock */
export const mockDashboardOverviewRes: ApiResponse<DashboardOverview> = {
  code: 200,
  message: 'ok',
  data: {
    stats: [
      {
        key: 'project',
        label: '项目数',
        value: 12,
        growth: 3,
      },
      {
        key: 'task',
        label: '任务数',
        value: 48,
        growth: 12,
      },
      {
        key: 'vulnerability',
        label: '漏洞数',
        value: 23,
        growth: -8,
        warnValue: true,
      },
      {
        key: 'autonomyRate',
        label: '平均自主率',
        value: 87.6,
        suffix: '%',
        growth: 2.4,
        growthSuffix: '%',
      },
    ],
  },
}
