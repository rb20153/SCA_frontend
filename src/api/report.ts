import type { ApiResponse, PageResult } from '@/types/common'
import type {
  GenerateReportParams,
  Report,
  ReportDownloadInfo,
  ReportFailureReason,
  ReportQueryParams,
} from '@/types/report'
import { MOCK_ALL_DETECT_TASKS } from '@/mock/modules/detect/taskList'
import { MOCK_ALL_PROJECTS } from '@/mock/modules/project/projectList'
import {
  MOCK_ALL_REPORTS,
  getMockReportFailureReason,
} from '@/mock/modules/report/reportList'
import { MOCK_ALL_REPORT_TEMPLATES } from '@/mock/modules/report/templateList'

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
 * 获取报告下载链接（已完成状态）
 * @param reportId - 报告 ID
 */
export function getReportDownloadUrl(
  reportId: string,
): Promise<ApiResponse<ReportDownloadInfo>> {
  const report = MOCK_ALL_REPORTS.find((item) => item.reportId === reportId)
  const url = report?.downloadUrl ?? `/mock/reports/${reportId}.pdf`
  const fileName = `${report?.reportName ?? reportId}.pdf`

  // TODO: replace with → return request.get(`/api/reports/${reportId}/download-url`)
  return Promise.resolve({
    code: 200,
    message: 'ok',
    data: { url, fileName },
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
