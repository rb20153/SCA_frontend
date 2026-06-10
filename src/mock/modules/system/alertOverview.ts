import type { ApiResponse } from '@/types/common'
import type { AlertCenterOverview, AlertQueueStatus } from '@/types/system'
import { getMockAlertsByStatus } from '@/mock/modules/system/alertList'

/** 按队列状态汇总概览统计 */
export function getMockAlertCenterOverview(
  status: AlertQueueStatus,
): AlertCenterOverview {
  const list = getMockAlertsByStatus(status)

  return {
    criticalCount: list.filter((item) => item.level === 'critical').length,
    importantCount: list.filter((item) => item.level === 'important').length,
    normalCount: list.filter((item) => item.level === 'normal').length,
  }
}

/** 告警中心概览 mock 响应 */
export function getMockAlertCenterOverviewRes(
  status: AlertQueueStatus,
): ApiResponse<AlertCenterOverview> {
  return {
    code: 200,
    message: 'ok',
    data: getMockAlertCenterOverview(status),
  }
}
