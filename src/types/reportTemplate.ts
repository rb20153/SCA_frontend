import type { PageParams } from '@/types/common'

/** 报告模板发布状态 */
export type ReportTemplateStatus = 'draft' | 'published' | 'publish_failed'

/** 报告输出格式 */
export type ReportTemplateOutputFormat = 'pdf' | 'word' | 'html'

/** 模板可见范围 */
export type ReportTemplateVisibility = 'global' | 'project' | 'private'

export interface ReportTemplate {
  templateId: string
  templateName: string
  version: string
  outputFormat: ReportTemplateOutputFormat
  visibility: ReportTemplateVisibility
  isDefault: boolean
  /** 系统内置模板（标准验收、管理摘要）不可删除 */
  isSystem: boolean
  status: ReportTemplateStatus
  /** 更新时间，ISO 8601 */
  updatedAt: string
}

export interface ReportTemplateListFilters {
  templateName: string
  outputFormat: ReportTemplateOutputFormat | ''
  visibility: ReportTemplateVisibility | ''
  status: ReportTemplateStatus | ''
}

export interface ReportTemplateQueryParams extends PageParams {
  templateName?: string
  outputFormat?: ReportTemplateOutputFormat
  visibility?: ReportTemplateVisibility
  status?: ReportTemplateStatus
}

export interface CreateReportTemplateParams {
  templateName: string
  /** 复制自某模板，空则空白模板 */
  copyFromTemplateId?: string
}

export interface ReportTemplatePublishFailureReason {
  templateId: string
  reason: string
}
