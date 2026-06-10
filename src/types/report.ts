import type { PageParams } from '@/types/common'
import type { Dayjs } from 'dayjs'

/** 报告生成状态 */
export type ReportStatus = 'completed' | 'generating' | 'failed'

export interface Report {
  reportId: string
  reportName: string
  projectName: string
  templateName: string
  /** 生成时间，ISO 8601 */
  generatedAt: string
  status: ReportStatus
  /** 已完成报告的可下载地址（mock 阶段占位） */
  downloadUrl?: string
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

export interface ReportDownloadInfo {
  url: string
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
