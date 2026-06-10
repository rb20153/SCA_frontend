import type {
  ReportTemplateListFilters,
  ReportTemplateOutputFormat,
  ReportTemplateQueryParams,
  ReportTemplateStatus,
  ReportTemplateVisibility,
} from '@/types/reportTemplate'
import {
  REPORT_TEMPLATE_OUTPUT_FORMAT_LABEL,
  REPORT_TEMPLATE_STATUS_LABEL,
  REPORT_TEMPLATE_VISIBILITY_LABEL,
} from '@/utils/reportTemplateDisplay'

/** 输出格式筛选项（默认「全部格式」） */
export const REPORT_TEMPLATE_OUTPUT_FORMAT_FILTER_OPTIONS: {
  value: ReportTemplateOutputFormat | ''
  label: string
}[] = [
  { value: '', label: '全部格式' },
  { value: 'pdf', label: REPORT_TEMPLATE_OUTPUT_FORMAT_LABEL.pdf },
  { value: 'html', label: REPORT_TEMPLATE_OUTPUT_FORMAT_LABEL.html },
  { value: 'word', label: REPORT_TEMPLATE_OUTPUT_FORMAT_LABEL.word },
]

/** 可见范围筛选项（默认「全部类型」） */
export const REPORT_TEMPLATE_VISIBILITY_FILTER_OPTIONS: {
  value: ReportTemplateVisibility | ''
  label: string
}[] = [
  { value: '', label: '全部类型' },
  { value: 'global', label: REPORT_TEMPLATE_VISIBILITY_LABEL.global },
  { value: 'project', label: REPORT_TEMPLATE_VISIBILITY_LABEL.project },
  { value: 'private', label: REPORT_TEMPLATE_VISIBILITY_LABEL.private },
]

/** 状态筛选项（默认「全部状态」） */
export const REPORT_TEMPLATE_STATUS_FILTER_OPTIONS: {
  value: ReportTemplateStatus | ''
  label: string
}[] = [
  { value: '', label: '全部状态' },
  { value: 'published', label: REPORT_TEMPLATE_STATUS_LABEL.published },
  { value: 'publish_failed', label: REPORT_TEMPLATE_STATUS_LABEL.publish_failed },
  { value: 'draft', label: REPORT_TEMPLATE_STATUS_LABEL.draft },
]

/** 返回空的报告模板列表筛选表单 */
export function createEmptyReportTemplateListFilters(): ReportTemplateListFilters {
  return {
    templateName: '',
    outputFormat: '',
    visibility: '',
    status: '',
  }
}

/** 将表单筛选条件转为 API 查询参数（空值不传） */
export function reportTemplateListFiltersToQuery(
  filters: ReportTemplateListFilters,
): Omit<ReportTemplateQueryParams, 'page' | 'pageSize'> {
  const query: Omit<ReportTemplateQueryParams, 'page' | 'pageSize'> = {}
  const templateName = filters.templateName.trim()

  if (templateName) query.templateName = templateName
  if (filters.outputFormat) query.outputFormat = filters.outputFormat
  if (filters.visibility) query.visibility = filters.visibility
  if (filters.status) query.status = filters.status

  return query
}
