import type { PageNavTabItem, SelectOption } from '@/types/common'
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

/** 模板编辑器 Tab */
export const REPORT_TEMPLATE_EDITOR_TABS: PageNavTabItem[] = [
  { key: 'content', label: '模板内容' },
  { key: 'export', label: '导出与权限' },
]

/** 输出格式下拉（无默认，须用户选择） */
export const REPORT_TEMPLATE_OUTPUT_FORMAT_OPTIONS: SelectOption[] = (
  ['html', 'pdf', 'word'] as ReportTemplateOutputFormat[]
).map((value) => ({
  label: REPORT_TEMPLATE_OUTPUT_FORMAT_LABEL[value],
  value,
}))

/** 可见范围下拉 */
export const REPORT_TEMPLATE_VISIBILITY_OPTIONS: SelectOption[] = (
  ['project', 'global', 'private'] as ReportTemplateVisibility[]
).map((value) => ({
  label: REPORT_TEMPLATE_VISIBILITY_LABEL[value],
  value,
}))

/** 是否默认模板下拉 */
export const REPORT_TEMPLATE_IS_DEFAULT_OPTIONS: SelectOption[] = [
  { label: '是', value: 'true' },
  { label: '否', value: 'false' },
]

/** 返回空的模板编辑器基本信息表单 */
export function createEmptyReportTemplateEditorForm() {
  return {
    templateName: '',
    version: '',
    outputFormat: undefined,
    visibility: undefined,
    projectId: undefined,
    isDefault: undefined,
  }
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
