import type { PageParams } from '@/types/common'
import type { Dayjs } from 'dayjs'

/** 报告生成状态 */
export type ReportStatus = 'completed' | 'generating' | 'failed'

/** 报告下载文件格式 */
export type ReportDownloadFormat = 'pdf' | 'word' | 'html'

/** 需审批报告的下载审批状态 */
export type ReportDownloadApprovalState =
  | 'not_required'
  | 'pending_submit'
  | 'pending_review'
  | 'approved'
  | 'rejected'

export interface Report {
  reportId: string
  reportName: string
  projectName: string
  templateName: string
  /** 生成时间，ISO 8601 */
  generatedAt: string
  status: ReportStatus
  /** 已完成报告的兼容下载地址；新流程使用 createReportDownload。 */
  downloadUrl?: string
}

/** 报告详情（查看抽屉；后续可扩展预览 URL 等字段） */
export type ReportDetail = Report

/** 报告在线预览的内容格式 */
export type ReportPreviewFormat = 'pdf' | 'html'

/** 报告在线预览信息（供详情抽屉内嵌 viewer 使用） */
export interface ReportPreview {
  reportId: string
  /** 预览内容格式，决定前端 iframe 内嵌 HTML 还是 PDF */
  format: ReportPreviewFormat
  /**
   * 预览文件地址。
   * - 外链 / 签名临时 URL：iframe 可直接加载
   * - 同源 /api 路径：由 ReportPreviewViewer 带 Token 拉取后安全内嵌
   */
  url: string
  /** 文件名（下载/标题展示用） */
  fileName: string
}

export interface ReportListFilters {
  reportName: string
  projectName: string
  generatedDate?: Dayjs
}

export interface ReportQueryParams extends PageParams {
  reportName?: string
  projectName?: string
  /** 生成日期，格式 YYYY-MM-DD */
  generatedDate?: string
}

/** 下载前展示的导出策略摘要（脱敏、水印、策略名） */
export interface ReportExportPolicyPreview {
  policyName: string
  desensitizeRoleLabel: string
  desensitizeLevel: string
  watermarkPreview: string
}

/** 点击下载时向后端查询的审批与策略信息 */
export interface ReportDownloadStatus {
  reportId: string
  requiresApproval: boolean
  approvalState: ReportDownloadApprovalState
  exportPolicy: ReportExportPolicyPreview
}

export interface CreateReportDownloadParams {
  format: ReportDownloadFormat
  includeEvidenceChain: boolean
}

export interface ReportDownloadInfo {
  downloadUrl: string
  fileName: string
}

export interface ReportFailureReason {
  reportId: string
  reason: string
}

export interface GenerateReportParams {
  projectId: string
  taskId: string
  templateId: string
}
