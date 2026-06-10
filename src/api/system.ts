import type { ApiResponse, PageResult } from '@/types/common'
import type {
  AlertCenterOverview,
  AlertDetail,
  AlertListItem,
  AlertOverviewQueryParams,
  AlertQueryParams,
  LogDetail,
  LogExportParams,
  LogExportResult,
  LogListItem,
  LogQueryParams,
} from '@/types/system'
import { getMockAlertCenterOverviewRes } from '@/mock/modules/system/alertOverview'
import { filterMockAlertList, getMockAlertDetail } from '@/mock/modules/system/alertList'
import {
  filterMockLogList,
  getMockLogDetail,
  getMockLogExportResult,
} from '@/mock/modules/system/logList'

const DEFAULT_PAGE_SIZE = 10

/**
 * 获取告警中心页概览统计
 * @param params - 队列状态（未处理 / 已处理）
 */
export function getAlertCenterOverview(
  params: AlertOverviewQueryParams,
): Promise<ApiResponse<AlertCenterOverview>> {
  // TODO: replace with → return request.get('/api/system/alerts/overview', { params })
  return Promise.resolve(getMockAlertCenterOverviewRes(params.status))
}

/**
 * 获取告警列表（分页 + 筛选）
 * @param params - 队列状态、级别、时间、分页
 */
export function getAlertList(
  params: AlertQueryParams,
): Promise<ApiResponse<PageResult<AlertListItem>>> {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE

  const sorted = filterMockAlertList(params)
  const start = (page - 1) * pageSize
  const list = sorted.slice(start, start + pageSize)

  // TODO: replace with → return request.get('/api/system/alerts', { params })
  return Promise.resolve({
    code: 200,
    message: 'ok',
    data: {
      list,
      total: sorted.length,
      page,
      pageSize,
    },
  })
}

/**
 * 获取告警详情（抽屉打开时请求）
 * @param alertId - 告警 ID
 */
export function getAlertDetail(alertId: string): Promise<ApiResponse<AlertDetail>> {
  const detail = getMockAlertDetail(alertId)
  if (!detail) {
    return Promise.reject(new Error('告警不存在'))
  }

  // TODO: replace with → return request.get(`/api/system/alerts/${alertId}`)
  return Promise.resolve({ code: 200, message: 'ok', data: detail })
}

/**
 * 获取审计日志列表（分页 + 筛选）
 * @param params - TraceID、用户、模块、结果、时间范围、分页
 */
export function getLogList(
  params: LogQueryParams,
): Promise<ApiResponse<PageResult<LogListItem>>> {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE

  const sorted = filterMockLogList(params)
  const start = (page - 1) * pageSize
  const list = sorted.slice(start, start + pageSize)

  // TODO: replace with → return request.get('/api/system/logs', { params })
  return Promise.resolve({
    code: 200,
    message: 'ok',
    data: {
      list,
      total: sorted.length,
      page,
      pageSize,
    },
  })
}

/**
 * 获取全链路日志详情（抽屉打开时请求）
 * @param logId - 日志记录 ID
 */
export function getLogDetail(logId: string): Promise<ApiResponse<LogDetail>> {
  const detail = getMockLogDetail(logId)
  if (!detail) {
    return Promise.reject(new Error('日志不存在'))
  }

  // TODO: replace with → return request.get(`/api/system/logs/${logId}`)
  return Promise.resolve({ code: 200, message: 'ok', data: detail })
}

/**
 * 按时间范围导出系统日志，返回可下载文件链接
 * @param params - 起止时间与导出格式
 */
export function exportLogs(params: LogExportParams): Promise<ApiResponse<LogExportResult>> {
  // TODO: replace with → return request.post('/api/system/logs/export', params)
  return Promise.resolve({
    code: 200,
    message: 'ok',
    data: getMockLogExportResult(params),
  })
}
