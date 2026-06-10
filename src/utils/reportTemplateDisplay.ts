import type {
  ReportTemplateOutputFormat,
  ReportTemplateStatus,
  ReportTemplateVisibility,
} from '@/types/reportTemplate'
import dayjs from 'dayjs'

export const REPORT_TEMPLATE_STATUS_LABEL: Record<ReportTemplateStatus, string> = {
  draft: '草稿',
  published: '已发布',
  publish_failed: '发布失败',
}

export const REPORT_TEMPLATE_STATUS_COLOR: Record<ReportTemplateStatus, string> = {
  draft: 'default',
  published: 'success',
  publish_failed: 'error',
}

export const REPORT_TEMPLATE_OUTPUT_FORMAT_LABEL: Record<ReportTemplateOutputFormat, string> = {
  pdf: 'PDF',
  word: 'Word',
  html: 'HTML',
}

export const REPORT_TEMPLATE_VISIBILITY_LABEL: Record<ReportTemplateVisibility, string> = {
  global: '全局可用',
  project: '项目组可用',
  private: '仅自己',
}

/** 报告模板列表表格横向滚动宽度 */
export const REPORT_TEMPLATE_TABLE_SCROLL_X = 1100

/**
 * 格式化模板更新时间为列表展示（仅年月日）
 * @param value - ISO 8601 字符串
 */
export function formatReportTemplateDate(value: string): string {
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : '—'
}
