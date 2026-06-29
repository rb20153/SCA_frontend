import type {
  ReportTemplateEditorForm,
  ReportTemplateExportSettings,
} from '@/types/reportTemplate'

/**
 * 保存模板前校验基本信息、Markdown 与水印必填项
 * @returns 校验失败时的提示文案；通过则返回 null
 */
export function validateReportTemplateBeforeSave(params: {
  form: ReportTemplateEditorForm
  markdownContent: string
  exportSettings: ReportTemplateExportSettings
}): string | null {
  const { form, markdownContent, exportSettings } = params

  if (!form.templateName?.trim()) {
    return '请填写模板名称'
  }
  if (!form.version?.trim()) {
    return '请填写版本'
  }
  if (!form.outputFormat) {
    return '请选择输出格式'
  }
  if (!form.visibility) {
    return '请选择可见范围'
  }
  if (form.visibility === 'project' && !form.projectId) {
    return '请选择绑定项目'
  }
  if (form.isDefault === undefined) {
    return '请选择是否为默认模板'
  }
  if (!markdownContent.trim()) {
    return '请填写 Markdown 模板内容'
  }
  if (exportSettings.watermarkEnabled && !exportSettings.watermarkContent?.trim()) {
    return '请填写水印内容'
  }

  return null
}
