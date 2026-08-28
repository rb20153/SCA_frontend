import request from '@/utils/request'
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
  buildReportDownloadFallbackFileName,
  createReportDownloadParamsToApi,
  generateReportParamsToApi,
  normalizeReport,
  normalizeReportDetail,
  normalizeReportDownloadInfo,
  normalizeReportDownloadStatus,
  normalizeReportFailureReason,
  normalizeReportPage,
  normalizeReportPreview,
  reportQueryParamsToApi,
} from '@/utils/reportAdapter'

/**
 * 获取报告列表（分页 + 筛选）
 * @param params - 分页与筛选参数
 */
export async function getReportList(
  params: ReportQueryParams,
): Promise<ApiResponse<PageResult<Report>>> {
  const res = await request.get<ApiResponse<unknown>>('/api/reports', {
    params: reportQueryParamsToApi(params),
  })
  return { ...res, data: normalizeReportPage(res.data ?? res) }
}

/**
 * 生成检测报告（提交后进入生成中状态）
 * @param data - 关联项目、任务与模板
 */
export async function generateReport(
  data: GenerateReportParams,
): Promise<ApiResponse<Report>> {
  const res = await request.post<ApiResponse<unknown>>(
    '/api/reports/generate',
    generateReportParamsToApi(data),
  )
  return { ...res, data: normalizeReport((res.data ?? {}) as Record<string, unknown>) }
}

/**
 * 删除报告
 * @param reportId - 要删除的报告 ID
 */
export async function deleteReport(reportId: string): Promise<ApiResponse<null>> {
  const res = await request.delete<ApiResponse<unknown>>(`/api/reports/${reportId}`)
  return { ...res, data: null }
}

/**
 * 获取报告详情（查看抽屉）
 * @param report - 当前报告列表项；详情字段缺失时用于展示兜底
 */
export async function getReportDetail(report: Report): Promise<ApiResponse<ReportDetail>> {
  const { reportId } = report
  const res = await request.get<ApiResponse<unknown>>(`/api/reports/${reportId}`)
  return { ...res, data: normalizeReportDetail(res.data, report) }
}

/**
 * 获取报告在线预览信息（详情抽屉内嵌 viewer 用）
 * @param reportId - 报告 ID
 * @returns 预览格式（pdf/html）与文件地址
 * 同源 /api 路径由 ReportPreviewViewer 带 Token 拉取；HTML 使用受限 srcdoc，PDF 使用 objectURL；
 * 外链或签名临时 URL 可直接给 iframe
 */
export async function getReportPreview(reportId: string): Promise<ApiResponse<ReportPreview>> {
  const res = await request.get<ApiResponse<unknown>>(`/api/reports/${reportId}/preview`)
  return { ...res, data: normalizeReportPreview(res.data, reportId) }
}

/**
 * 查询报告下载审批状态与导出策略摘要（点击下载时首先调用）
 * @param reportId - 报告 ID
 */
export async function getReportDownloadStatus(
  reportId: string,
): Promise<ApiResponse<ReportDownloadStatus>> {
  const res = await request.get<ApiResponse<unknown>>(`/api/reports/${reportId}/download-status`)
  return { ...res, data: normalizeReportDownloadStatus(res.data, reportId) }
}

/**
 * 提交报告下载审批申请
 * @param reportId - 报告 ID
 * 重复提交/无需审批等业务校验由后端判定，失败信息经拦截器统一弹出
 */
export async function submitReportDownloadApplication(
  reportId: string,
): Promise<ApiResponse<null>> {
  const res = await request.post<ApiResponse<unknown>>(
    `/api/reports/${reportId}/download-applications`,
  )
  return { ...res, data: null }
}

/**
 * 创建报告下载任务并返回临时下载链接
 * @param reportId - 报告 ID
 * @param params - 格式与是否包含证据链
 * @param reportName - 报告名称，仅用于后端未返回 fileName 时拼兜底文件名
 */
export async function createReportDownload(
  reportId: string,
  params: CreateReportDownloadParams,
  reportName = '',
): Promise<ApiResponse<ReportDownloadInfo>> {
  const res = await request.post<ApiResponse<unknown>>(
    `/api/reports/${reportId}/downloads`,
    createReportDownloadParamsToApi(params),
  )
  return {
    ...res,
    data: normalizeReportDownloadInfo(
      res.data,
      buildReportDownloadFallbackFileName(reportName || reportId, params),
    ),
  }
}

/**
 * 获取报告生成失败原因
 * @param reportId - 报告 ID
 */
export async function getReportFailureReason(
  reportId: string,
): Promise<ApiResponse<ReportFailureReason>> {
  const res = await request.get<ApiResponse<unknown>>(`/api/reports/${reportId}/failure-reason`)
  return { ...res, data: normalizeReportFailureReason(res.data, reportId) }
}
