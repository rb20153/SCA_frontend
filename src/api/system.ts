import type { ApiResponse, PageResult } from '@/types/common'
import type {
  AlertCenterOverview,
  AlertDetail,
  AlertListItem,
  AlertOverviewQueryParams,
  AlertQueryParams,
  CreateDepartmentParams,
  Department,
  DepartmentMemberCheckResult,
  DepartmentQueryParams,
  LogDetail,
  LogExportParams,
  LogExportResult,
  LogListItem,
  LogQueryParams,
  UpdateDepartmentParams,
} from '@/types/system'
import {
  MOCK_ALL_DEPARTMENTS,
  MOCK_DEPARTMENT_MEMBER_COUNTS,
  createMockDepartmentId,
  filterMockDepartmentList,
  getMockDepartmentMemberCount,
} from '@/mock/modules/system/departmentList'
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

/**
 * 获取部门列表（分页 + 筛选，平级不分上下级）
 * @param params - 部门名称、状态、分页
 */
export function getDepartmentList(
  params: DepartmentQueryParams,
): Promise<ApiResponse<PageResult<Department>>> {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE

  const sorted = filterMockDepartmentList(params)
  const start = (page - 1) * pageSize
  const list = sorted.slice(start, start + pageSize)

  // TODO: replace with → return request.get('/api/system/departments', { params })
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
 * 新增部门
 * @param data - 部门名称、状态、备注
 */
export function createDepartment(
  data: CreateDepartmentParams,
): Promise<ApiResponse<Department>> {
  const departmentName = data.departmentName.trim()
  if (!departmentName) {
    return Promise.reject(new Error('部门名称不能为空'))
  }

  const departmentId = createMockDepartmentId()
  const record = {
    departmentId,
    departmentName,
    status: data.status,
    remark: data.remark.trim(),
    createdAt: new Date().toISOString(),
  }

  MOCK_ALL_DEPARTMENTS.push(record)
  MOCK_DEPARTMENT_MEMBER_COUNTS[departmentId] = 0

  // TODO: replace with → return request.post('/api/system/departments', data)
  return Promise.resolve({
    code: 200,
    message: 'ok',
    data: { ...record, memberCount: 0 },
  })
}

/**
 * 更新部门
 * @param departmentId - 部门 ID
 * @param data - 可编辑字段
 */
export function updateDepartment(
  departmentId: string,
  data: UpdateDepartmentParams,
): Promise<ApiResponse<Department>> {
  const departmentName = data.departmentName.trim()
  if (!departmentName) {
    return Promise.reject(new Error('部门名称不能为空'))
  }

  const index = MOCK_ALL_DEPARTMENTS.findIndex((item) => item.departmentId === departmentId)
  if (index < 0) {
    return Promise.reject(new Error('部门不存在'))
  }

  const updated = {
    ...MOCK_ALL_DEPARTMENTS[index],
    departmentName,
    status: data.status,
    remark: data.remark.trim(),
  }
  MOCK_ALL_DEPARTMENTS[index] = updated

  // TODO: replace with → return request.put(`/api/system/departments/${departmentId}`, data)
  return Promise.resolve({
    code: 200,
    message: 'ok',
    data: {
      ...updated,
      memberCount: getMockDepartmentMemberCount(departmentId),
    },
  })
}

/**
 * 删除前检查部门是否仍有绑定用户
 * @param departmentId - 部门 ID
 */
export function checkDepartmentMembers(
  departmentId: string,
): Promise<ApiResponse<DepartmentMemberCheckResult>> {
  const memberCount = getMockDepartmentMemberCount(departmentId)
  const result: DepartmentMemberCheckResult = {
    hasMembers: memberCount > 0,
    memberCount,
  }

  // TODO: replace with → return request.get(`/api/system/departments/${departmentId}/member-check`)
  return Promise.resolve({ code: 200, message: 'ok', data: result })
}

/**
 * 删除部门（调用方应先通过 checkDepartmentMembers 确认无成员）
 * @param departmentId - 部门 ID
 */
export function deleteDepartment(departmentId: string): Promise<ApiResponse<null>> {
  const index = MOCK_ALL_DEPARTMENTS.findIndex((item) => item.departmentId === departmentId)
  if (index < 0) {
    return Promise.reject(new Error('部门不存在'))
  }

  MOCK_ALL_DEPARTMENTS.splice(index, 1)
  delete MOCK_DEPARTMENT_MEMBER_COUNTS[departmentId]

  // TODO: replace with → return request.delete(`/api/system/departments/${departmentId}`)
  return Promise.resolve({ code: 200, message: 'ok', data: null })
}
