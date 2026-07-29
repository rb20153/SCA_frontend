import type { ApiResponse, PageResult } from '@/types/common'
import request from '@/utils/request'
import type {
  AlertAssigneeOption,
  AlertCenterOverview,
  AlertDetail,
  AlertListItem,
  AlertOverviewQueryParams,
  AlertQueryParams,
  AlertTimeline,
  CreateDepartmentParams,
  CreateRoleParams,
  Department,
  DepartmentMemberCheckResult,
  DepartmentQueryParams,
  HandleAlertParams,
  HandleAlertResult,
  LogDetail,
  LogExportParams,
  LogExportResult,
  LogListItem,
  LogQueryParams,
  Role,
  RoleQueryParams,
  UpdateDepartmentParams,
  UpdateRoleParams,
} from '@/types/system'
import {
  createDepartmentParamsToApi,
  normalizeDepartment,
  normalizeDepartmentMemberCheck,
  normalizeDepartmentPage,
  normalizeRole,
  normalizeRolePage,
  roleParamsToApi,
  systemQueryParamsToApi,
  updateDepartmentParamsToApi,
} from '@/utils/systemAdapter'
import { getMockAlertCenterOverviewRes } from '@/mock/modules/system/alertOverview'
import { MOCK_ALERT_ASSIGNEE_OPTIONS } from '@/mock/modules/system/alertAssignees'
import { mockHandleAlert } from '@/mock/modules/system/alertHandle'
import { filterMockAlertList, getMockAlertDetail } from '@/mock/modules/system/alertList'
import { getMockAlertTimeline } from '@/mock/modules/system/alertTimeline'
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
 * 提交告警处置（未处理 Tab「处理」/「忽略本次」）
 * @param alertId - 告警 ID
 * @param data - 处置方式与附加字段
 * @param handlerName - 当前操作人姓名（mock 写入处理人；联调时由后端从 token 解析）
 */
export function handleAlert(
  alertId: string,
  data: HandleAlertParams,
  handlerName: string,
): Promise<ApiResponse<HandleAlertResult>> {
  try {
    const result = mockHandleAlert(alertId, data, handlerName)
    // TODO: replace with → return request.post(`/api/system/alerts/${alertId}/handle`, data)
    return Promise.resolve({ code: 200, message: 'ok', data: result })
  } catch (e) {
    const msg = e instanceof Error ? e.message : '处置失败'
    return Promise.reject(new Error(msg))
  }
}

/**
 * 获取转派复核候选人列表（处理弹窗下拉）
 */
export function getAlertAssigneeOptions(): Promise<ApiResponse<AlertAssigneeOption[]>> {
  // TODO: replace with → return request.get('/api/system/alerts/assignees')
  return Promise.resolve({ code: 200, message: 'ok', data: MOCK_ALERT_ASSIGNEE_OPTIONS })
}

/**
 * 获取已处理告警的处理时间线
 * @param alertId - 告警 ID
 */
export function getAlertTimeline(alertId: string): Promise<ApiResponse<AlertTimeline>> {
  const timeline = getMockAlertTimeline(alertId)
  if (!timeline) {
    return Promise.reject(new Error('暂无处理时间线'))
  }
  // TODO: replace with → return request.get(`/api/system/alerts/${alertId}/timeline`)
  return Promise.resolve({ code: 200, message: 'ok', data: timeline })
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
 * 获取部门列表（分页 + 筛选）
 * @param params - 部门名称、状态、分页
 */
export async function getDepartmentList(
  params: DepartmentQueryParams,
): Promise<ApiResponse<PageResult<Department>>> {
  const res = await request.get<ApiResponse<unknown>>('/api/system/departments', {
    params: systemQueryParamsToApi(params),
  })
  const pageRaw = res.data ?? res
  return { ...res, data: normalizeDepartmentPage(pageRaw) }
}

/**
 * 新增部门
 * @param data - 部门名称、状态、备注
 */
export async function createDepartment(
  data: CreateDepartmentParams,
): Promise<ApiResponse<Department>> {
  const res = await request.post<ApiResponse<unknown>>(
    '/api/system/departments',
    createDepartmentParamsToApi(data),
  )
  const deptRaw =
    res.data && typeof res.data === 'object' ? (res.data as Record<string, unknown>) : {}
  return { ...res, data: normalizeDepartment(deptRaw) }
}

/**
 * 更新部门
 * @param departmentId - 部门 ID
 * @param data - 可编辑字段
 */
export async function updateDepartment(
  departmentId: string,
  data: UpdateDepartmentParams,
): Promise<ApiResponse<Department>> {
  const res = await request.put<ApiResponse<unknown>>(
    `/api/system/departments/${departmentId}`,
    updateDepartmentParamsToApi(data),
  )
  const deptRaw =
    res.data && typeof res.data === 'object' ? (res.data as Record<string, unknown>) : {}
  return { ...res, data: normalizeDepartment(deptRaw) }
}

/**
 * 删除前检查部门是否仍有绑定用户
 * @param departmentId - 部门 ID
 */
export async function checkDepartmentMembers(
  departmentId: string,
): Promise<ApiResponse<DepartmentMemberCheckResult>> {
  const res = await request.get<ApiResponse<unknown>>(
    `/api/system/departments/${departmentId}/member-check`,
  )
  return { ...res, data: normalizeDepartmentMemberCheck(res.data) }
}

/**
 * 删除部门（调用方应先通过 checkDepartmentMembers 确认无成员）
 * @param departmentId - 部门 ID
 */
export async function deleteDepartment(departmentId: string): Promise<ApiResponse<null>> {
  return request.delete<ApiResponse<null>>(`/api/system/departments/${departmentId}`)
}

/**
 * 获取角色列表（分页 + 筛选）
 * @param params - 角色名称、状态、分页
 */
export async function getRoleList(
  params: RoleQueryParams,
): Promise<ApiResponse<PageResult<Role>>> {
  const res = await request.get<ApiResponse<unknown>>('/api/system/roles', {
    params: systemQueryParamsToApi(params),
  })
  const pageRaw = res.data ?? res
  return { ...res, data: normalizeRolePage(pageRaw) }
}

/**
 * 新增角色
 * @param data - 角色名称、编码、状态、备注、权限
 */
export async function createRole(data: CreateRoleParams): Promise<ApiResponse<Role>> {
  const res = await request.post<ApiResponse<unknown>>(
    '/api/system/roles',
    roleParamsToApi(data),
  )
  const roleRaw =
    res.data && typeof res.data === 'object' ? (res.data as Record<string, unknown>) : {}
  return { ...res, data: normalizeRole(roleRaw) }
}

/**
 * 更新角色
 * @param roleId - 角色 ID
 * @param data - 可编辑字段
 */
export async function updateRole(
  roleId: string,
  data: UpdateRoleParams,
): Promise<ApiResponse<Role>> {
  const res = await request.put<ApiResponse<unknown>>(
    `/api/system/roles/${roleId}`,
    roleParamsToApi(data),
  )
  const roleRaw =
    res.data && typeof res.data === 'object' ? (res.data as Record<string, unknown>) : {}
  return { ...res, data: normalizeRole(roleRaw) }
}

/**
 * 删除角色（仅自定义角色；调用方应先确认 boundUserCount 为 0）
 * @param roleId - 角色 ID
 */
export async function deleteRole(roleId: string): Promise<ApiResponse<null>> {
  return request.delete<ApiResponse<null>>(`/api/system/roles/${roleId}`)
}
