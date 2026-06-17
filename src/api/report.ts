import type { ApiResponse, PageResult } from '@/types/common'
import type {
  CreateReportDownloadParams,
  GenerateReportParams,
  Report,
  ReportDetail,
  ReportDownloadInfo,
  ReportDownloadStatus,
  ReportFailureReason,
  ReportPreview,
  ReportQueryParams,
} from '@/types/report'
import {
  createMockReportDownload,
  getMockReportDownloadStatus,
  submitMockReportDownloadApplication,
} from '@/mock/modules/report/reportDownload'
import { MOCK_ALL_DETECT_TASKS } from '@/mock/modules/detect/taskList'
import { MOCK_ALL_PROJECTS } from '@/mock/modules/project/projectList'
import {
  MOCK_ALL_REPORTS,
  getMockReportDetail,
  getMockReportFailureReason,
} from '@/mock/modules/report/reportList'
import { MOCK_ALL_REPORT_TEMPLATES } from '@/mock/modules/report/templateList'
import { getMockReportPreview } from '@/mock/modules/report/reportPreview'

// TODO: replace with: import request from '@/utils/request'

const DEFAULT_PAGE_SIZE = 10

function toDateKey(iso: string): string {
  return iso.slice(0, 10)
}

/** mock 阶段按筛选条件过滤报告列表 */
function filterMockReports(params: ReportQueryParams): Report[] {
  let list = [...MOCK_ALL_REPORTS]

  const reportName = params.reportName?.trim()
  if (reportName) {
    list = list.filter((item) => item.reportName.includes(reportName))
  }

  const projectName = params.projectName?.trim()
  if (projectName) {
    list = list.filter((item) => item.projectName.includes(projectName))
  }

  if (params.generatedDate) {
    list = list.filter((item) => toDateKey(item.generatedAt) === params.generatedDate)
  }

  return list.sort(
    (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime(),
  )
}

/**
 * 获取报告列表（分页 + 筛选）
 * @param params - 分页与筛选参数
 */
export function getReportList(
  params: ReportQueryParams,
): Promise<ApiResponse<PageResult<Report>>> {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE

  const sorted = filterMockReports(params)
  const start = (page - 1) * pageSize
  const list = sorted.slice(start, start + pageSize)

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
 * 生成检测报告（提交后进入生成中状态）
 * @param data - 关联项目、任务与模板
 */
export function generateReport(
  data: GenerateReportParams,
): Promise<ApiResponse<Report>> {
  const project = MOCK_ALL_PROJECTS.find((item) => item.projectId === data.projectId)
  const task = MOCK_ALL_DETECT_TASKS.find((item) => item.taskId === data.taskId)
  const template = MOCK_ALL_REPORT_TEMPLATES.find(
    (item) => item.templateId === data.templateId,
  )

  const seq = MOCK_ALL_REPORTS.length + 1
  const created: Report = {
    reportId: `report-${String(seq).padStart(3, '0')}`,
    reportName: `${task?.taskName ?? '检测任务'}报告`,
    projectName: project?.projectName ?? '—',
    templateName: template?.templateName ?? '—',
    generatedAt: new Date().toISOString(),
    status: 'generating',
  }

  MOCK_ALL_REPORTS.unshift(created)

  // TODO: replace with → return request.post('/api/reports/generate', data)
  return Promise.resolve({ code: 200, message: 'ok', data: created })
}

/**
 * 删除报告
 * @param reportId - 要删除的报告 ID
 */
export function deleteReport(reportId: string): Promise<ApiResponse<null>> {
  const index = MOCK_ALL_REPORTS.findIndex((item) => item.reportId === reportId)
  if (index >= 0) {
    MOCK_ALL_REPORTS.splice(index, 1)
  }

  // TODO: replace with → return request.delete(`/api/reports/${reportId}`)
  return Promise.resolve({ code: 200, message: 'ok', data: null })
}

/**
 * 获取报告详情（查看抽屉）
 * @param reportId - 报告 ID
 */
export function getReportDetail(reportId: string): Promise<ApiResponse<ReportDetail>> {
  const detail = getMockReportDetail(reportId)
  if (!detail) {
    return Promise.reject(new Error('报告不存在'))
  }

  // TODO: replace with → return request.get(`/api/reports/${reportId}`)
  return Promise.resolve({ code: 200, message: 'ok', data: detail })
}

/**
 * 获取报告在线预览信息（详情抽屉内嵌 viewer 用）
 * @param reportId - 报告 ID
 * @returns 预览格式（pdf/html）与文件地址
 */
export function getReportPreview(reportId: string): Promise<ApiResponse<ReportPreview>> {
  const detail = getMockReportDetail(reportId)
  if (!detail) {
    return Promise.reject(new Error('报告不存在'))
  }
  // TODO: replace with → return request.get(`/api/reports/${reportId}/preview`)
  // 真实接入：后端返回带签名的临时预览 URL；若需鉴权可改为 request.get(url, { responseType: 'blob' }) 后生成 objectURL
  return Promise.resolve({ code: 200, message: 'ok', data: getMockReportPreview(reportId) })
}

/**
 * 查询报告下载审批状态与导出策略摘要（点击下载时首先调用）
 * @param reportId - 报告 ID
 */
export function getReportDownloadStatus(
  reportId: string,
): Promise<ApiResponse<ReportDownloadStatus>> {
  const report = MOCK_ALL_REPORTS.find((item) => item.reportId === reportId)
  if (!report || report.status !== 'completed') {
    return Promise.reject(new Error('报告不可下载'))
  }

  // TODO: replace with → return request.get(`/api/reports/${reportId}/download-status`)
  return Promise.resolve({
    code: 200,
    message: 'ok',
    data: getMockReportDownloadStatus(reportId),
  })
}

/**
 * 提交报告下载审批申请
 * @param reportId - 报告 ID
 */
export function submitReportDownloadApplication(
  reportId: string,
): Promise<ApiResponse<null>> {
  const status = getMockReportDownloadStatus(reportId)
  if (!status.requiresApproval) {
    return Promise.reject(new Error('该报告无需审批'))
  }
  if (status.approvalState === 'pending_review') {
    return Promise.reject(new Error('申请已提交，请勿重复操作'))
  }
  if (status.approvalState === 'approved') {
    return Promise.reject(new Error('已通过审批，请直接下载'))
  }

  submitMockReportDownloadApplication(reportId)

  // TODO: replace with → return request.post(`/api/reports/${reportId}/download-applications`)
  return Promise.resolve({ code: 200, message: 'ok', data: null })
}

/**
 * 创建报告下载任务并返回临时下载链接
 * @param reportId - 报告 ID
 * @param params - 格式与是否包含证据链
 */
export function createReportDownload(
  reportId: string,
  params: CreateReportDownloadParams,
): Promise<ApiResponse<ReportDownloadInfo>> {
  const report = MOCK_ALL_REPORTS.find((item) => item.reportId === reportId)
  if (!report || report.status !== 'completed') {
    return Promise.reject(new Error('报告不可下载'))
  }

  const status = getMockReportDownloadStatus(reportId)
  if (status.requiresApproval && status.approvalState !== 'approved') {
    return Promise.reject(new Error('下载未通过审批'))
  }

  // TODO: replace with → return request.post(`/api/reports/${reportId}/downloads`, params)
  return Promise.resolve({
    code: 200,
    message: 'ok',
    data: createMockReportDownload(reportId, report.reportName, params),
  })
}

/**
 * 获取报告生成失败原因
 * @param reportId - 报告 ID
 */
export function getReportFailureReason(
  reportId: string,
): Promise<ApiResponse<ReportFailureReason>> {
  const report = MOCK_ALL_REPORTS.find((item) => item.reportId === reportId)

  // TODO: replace with → return request.get(`/api/reports/${reportId}/failure-reason`)
  return Promise.resolve({
    code: 200,
    message: 'ok',
    data: {
      reportId,
      reason: report ? getMockReportFailureReason(report.reportName) : '未找到该报告的失败原因',
    },
  })
}
