import type { ApiResponse, PageResult } from '@/types/common'
import request from '@/utils/request'
import type {
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
  alertQueryParamsToApi,
  handleAlertParamsToApi,
  logExportParamsToApi,
  normalizeAlertCenterOverview,
  normalizeAlertDetail,
  normalizeAlertPage,
  normalizeAlertTimeline,
  normalizeDepartment,
  normalizeDepartmentMemberCheck,
  normalizeDepartmentPage,
  normalizeHandleAlertResult,
  normalizeLogDetail,
  normalizeLogExportResult,
  normalizeLogPage,
  normalizeRole,
  normalizeRolePage,
  roleParamsToApi,
  systemQueryParamsToApi,
  updateDepartmentParamsToApi,
} from '@/utils/systemAdapter'

/**
 * 获取告警中心页概览统计
 * @param params - 队列状态（未处理 / 已处理）
 */
export async function getAlertCenterOverview(
  params: AlertOverviewQueryParams,
): Promise<ApiResponse<AlertCenterOverview>> {
  const res = await request.get<ApiResponse<unknown>>('/api/system/alerts/overview', {
    params: { status: params.status },
  })
  return { ...res, data: normalizeAlertCenterOverview(res.data) }
}

/**
 * 获取告警列表（分页 + 筛选）
 * @param params - 队列状态、级别、时间、分页
 */
export async function getAlertList(
  params: AlertQueryParams,
): Promise<ApiResponse<PageResult<AlertListItem>>> {
  const res = await request.get<ApiResponse<unknown>>('/api/system/alerts', {
    params: alertQueryParamsToApi(params),
  })
  const pageRaw = res.data ?? res
  return { ...res, data: normalizeAlertPage(pageRaw, params.status) }
}

/**
 * 获取告警详情（抽屉打开时请求）
 * @param alertId - 告警 ID
 */
export async function getAlertDetail(alertId: string): Promise<ApiResponse<AlertDetail>> {
  const res = await request.get<ApiResponse<unknown>>(`/api/system/alerts/${alertId}`)
  return { ...res, data: normalizeAlertDetail(res.data, alertId) }
}

/**
 * 提交告警处置（自动恢复 / 人工修复 / 关闭告警）
 * @param alertId - 告警 ID
 * @param data - 处置方式与附加字段
 */
export async function handleAlert(
  alertId: string,
  data: HandleAlertParams,
): Promise<ApiResponse<HandleAlertResult>> {
  const res = await request.post<ApiResponse<unknown>>(
    `/api/system/alerts/${alertId}/handle`,
    handleAlertParamsToApi(data),
  )
  return { ...res, data: normalizeHandleAlertResult(res.data) }
}

/**
 * 获取已处理告警的处理时间线
 * @param alertId - 告警 ID
 */
export async function getAlertTimeline(alertId: string): Promise<ApiResponse<AlertTimeline>> {
  const res = await request.get<ApiResponse<unknown>>(`/api/system/alerts/${alertId}/timeline`)
  return { ...res, data: normalizeAlertTimeline(res.data, alertId) }
}

/**
 * 获取审计日志列表（分页 + 筛选）
 * @param params - TraceID、用户、模块、结果、时间范围、分页
 */
export async function getLogList(
  params: LogQueryParams,
): Promise<ApiResponse<PageResult<LogListItem>>> {
  const res = await request.get<ApiResponse<unknown>>('/api/system/logs', {
    params: systemQueryParamsToApi(params),
  })
  const pageRaw = res.data ?? res
  return { ...res, data: normalizeLogPage(pageRaw) }
}

/**
 * 获取全链路日志详情（抽屉打开时请求）
 * @param logId - 日志记录 ID
 */
export async function getLogDetail(logId: string): Promise<ApiResponse<LogDetail>> {
  const res = await request.get<ApiResponse<unknown>>(`/api/system/logs/${logId}`)
  return { ...res, data: normalizeLogDetail(res.data, logId) }
}

/**
 * 按时间范围导出系统日志，返回可下载文件链接
 * @param params - 起止时间与导出格式
 */
export async function exportLogs(params: LogExportParams): Promise<ApiResponse<LogExportResult>> {
  const res = await request.post<ApiResponse<unknown>>(
    '/api/system/logs/export',
    logExportParamsToApi(params),
  )
  return { ...res, data: normalizeLogExportResult(res.data) }
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
