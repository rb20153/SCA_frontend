import { getMockTemplateExportSettings, setMockTemplateExportSettings } from '@/mock/modules/report/templateExportSettings'
import { getMockTemplateMarkdownContent, setMockTemplateMarkdownContent } from '@/mock/modules/report/templateMarkdown'
import {
  DEFAULT_REPORT_TEMPLATE_MARKDOWN,
  MOCK_REPORT_TEMPLATE_VARIABLES,
} from '@/mock/modules/report/templateVariables'
import { MOCK_ALL_PROJECTS } from '@/mock/modules/project/projectList'
import { MOCK_ALL_REPORT_TEMPLATES } from '@/mock/modules/report/templateList'
import type {
  NewReportTemplateDraftParams,
  ReportTemplate,
  ReportTemplateDetail,
  SaveReportTemplateParams,
} from '@/types/reportTemplate'
import { createDefaultReportTemplateExportSettings } from '@/utils/reportTemplateExportDisplay'
import { convertMarkdownVariablesToChinese } from '@/utils/reportTemplateMarkdown'

/** 新建模板进入编辑器时的默认版本号 */
export const NEW_REPORT_TEMPLATE_VERSION = 'v1.0'

/** mock：模板 ID → 绑定项目 ID（保存时写入） */
const MOCK_TEMPLATE_PROJECT_BINDINGS: Record<string, string> = {}

/** 项目组可用模板的 mock 绑定关系（优先读保存记录，否则按索引分配） */
function resolveMockBoundProject(templateId: string): { projectId: string; projectName: string } | undefined {
  const boundProjectId = MOCK_TEMPLATE_PROJECT_BINDINGS[templateId]
  if (boundProjectId) {
    const project = MOCK_ALL_PROJECTS.find((item) => item.projectId === boundProjectId)
    if (project) {
      return {
        projectId: project.projectId,
        projectName: project.projectName,
      }
    }
  }

  const index = MOCK_ALL_REPORT_TEMPLATES.findIndex((item) => item.templateId === templateId)
  if (index < 0) {
    return undefined
  }

  const project = MOCK_ALL_PROJECTS[index % MOCK_ALL_PROJECTS.length]
  return {
    projectId: project.projectId,
    projectName: project.projectName,
  }
}

/** 解析模板 Markdown：存储为英文 varKey，编辑器展示转为中文变量名 */
function resolveMarkdownContent(template: ReportTemplate, sourceTemplateId?: string): string {
  if (template.isNewBlank) {
    return DEFAULT_REPORT_TEMPLATE_MARKDOWN
  }

  const storedId = sourceTemplateId ?? template.templateId
  const raw = getMockTemplateMarkdownContent(storedId)
  return convertMarkdownVariablesToChinese(raw, MOCK_REPORT_TEMPLATE_VARIABLES)
}

/** 解析导出与权限：空白新建用默认；复制/编辑用已存或源模板配置 */
function resolveExportSettings(template: ReportTemplate, sourceTemplateId?: string): ReportTemplateDetail['exportSettings'] {
  if (template.isNewBlank) {
    return createDefaultReportTemplateExportSettings()
  }

  const storedId = sourceTemplateId ?? template.templateId
  return getMockTemplateExportSettings(storedId)
}

/** 将列表项转为完整详情（已有模板编辑场景） */
function buildFullDetailFromListItem(template: ReportTemplate): ReportTemplateDetail {
  const boundProject =
    template.visibility === 'project' ? resolveMockBoundProject(template.templateId) : undefined

  return {
    templateId: template.templateId,
    templateName: template.templateName,
    version: template.version,
    outputFormat: template.outputFormat,
    visibility: template.visibility,
    isDefault: template.isDefault,
    projectId: boundProject?.projectId,
    projectName: boundProject?.projectName,
    markdownContent: resolveMarkdownContent(template),
    variables: MOCK_REPORT_TEMPLATE_VARIABLES,
    exportSettings: resolveExportSettings(template),
    isSystem: template.isSystem,
    status: template.status,
    updatedAt: template.updatedAt,
  }
}

/** 新建空白模板详情：仅名称 + 默认版本，其余字段留空；正文用默认示例 */
function buildBlankNewDetail(template: ReportTemplate): ReportTemplateDetail {
  return {
    templateId: template.templateId,
    templateName: template.templateName,
    version: NEW_REPORT_TEMPLATE_VERSION,
    markdownContent: DEFAULT_REPORT_TEMPLATE_MARKDOWN,
    variables: MOCK_REPORT_TEMPLATE_VARIABLES,
    exportSettings: createDefaultReportTemplateExportSettings(),
    isSystem: false,
    status: template.status,
    updatedAt: template.updatedAt,
  }
}

/** 新建且复制自某模板：合并源模板字段，版本固定 v1.0，名称用新建模板 */
function buildDetailFromCopySource(template: ReportTemplate): ReportTemplateDetail | null {
  const sourceId = template.copyFromTemplateId
  if (!sourceId) {
    return null
  }

  const sourceTemplate = MOCK_ALL_REPORT_TEMPLATES.find((item) => item.templateId === sourceId)
  if (!sourceTemplate) {
    return buildBlankNewDetail(template)
  }

  const sourceDetail = buildFullDetailFromListItem(sourceTemplate)

  return {
    ...sourceDetail,
    templateId: template.templateId,
    templateName: template.templateName,
    version: NEW_REPORT_TEMPLATE_VERSION,
    isDefault: false,
    isSystem: false,
    status: template.status,
    updatedAt: template.updatedAt,
    markdownContent: resolveMarkdownContent(template, sourceId),
    variables: MOCK_REPORT_TEMPLATE_VARIABLES,
    exportSettings: resolveExportSettings(template, sourceId),
  }
}

/**
 * 获取报告模板详情 mock
 * @param templateId - 模板 ID
 */
export function getMockReportTemplateDetail(templateId: string): ReportTemplateDetail | null {
  const template = MOCK_ALL_REPORT_TEMPLATES.find((item) => item.templateId === templateId)
  if (!template) {
    return null
  }

  if (template.copyFromTemplateId) {
    return buildDetailFromCopySource(template)
  }

  if (template.isNewBlank) {
    return buildBlankNewDetail(template)
  }

  return buildFullDetailFromListItem(template)
}

/**
 * 新建模板进入编辑器时的草稿详情（未落库，templateId 固定为 new）
 * @param draft - 弹窗带入的模板名称与复制来源
 */
export function getMockNewReportTemplateEditorDetail(
  draft: NewReportTemplateDraftParams,
): ReportTemplateDetail {
  const templateName = draft.templateName.trim()
  const now = new Date().toISOString()

  if (draft.copyFromTemplateId) {
    const sourceTemplate = MOCK_ALL_REPORT_TEMPLATES.find(
      (item) => item.templateId === draft.copyFromTemplateId,
    )
    if (sourceTemplate) {
      const sourceDetail = buildFullDetailFromListItem(sourceTemplate)
      return {
        ...sourceDetail,
        templateId: 'new',
        templateName,
        version: NEW_REPORT_TEMPLATE_VERSION,
        isDefault: undefined,
        isSystem: false,
        status: 'draft',
        updatedAt: now,
        markdownContent: resolveMarkdownContent(
          { ...sourceTemplate, templateId: 'new' },
          draft.copyFromTemplateId,
        ),
        variables: MOCK_REPORT_TEMPLATE_VARIABLES,
        exportSettings: resolveExportSettings(
          { ...sourceTemplate, templateId: 'new' },
          draft.copyFromTemplateId,
        ),
      }
    }
  }

  return {
    templateId: 'new',
    templateName,
    version: NEW_REPORT_TEMPLATE_VERSION,
    markdownContent: DEFAULT_REPORT_TEMPLATE_MARKDOWN,
    variables: MOCK_REPORT_TEMPLATE_VARIABLES,
    exportSettings: createDefaultReportTemplateExportSettings(),
    isSystem: false,
    status: 'draft',
    updatedAt: now,
  }
}

/**
 * mock 保存模板：新建（templateId=new）或更新已有模板
 * @param templateId - 模板 ID，新建传 new
 * @param data - 保存请求体（Markdown 为英文 varKey）
 */
export function mockSaveReportTemplate(
  templateId: string,
  data: SaveReportTemplateParams,
): ReportTemplateDetail {
  const now = new Date().toISOString()
  let targetId = templateId

  if (templateId === 'new') {
    const seq = MOCK_ALL_REPORT_TEMPLATES.length + 1
    targetId = `tpl-${String(seq).padStart(3, '0')}`
    const created: ReportTemplate = {
      templateId: targetId,
      templateName: data.templateName,
      version: data.version,
      outputFormat: data.outputFormat,
      visibility: data.visibility,
      isDefault: data.isDefault,
      isSystem: false,
      status: 'draft',
      updatedAt: now,
    }
    MOCK_ALL_REPORT_TEMPLATES.push(created)
  } else {
    const template = MOCK_ALL_REPORT_TEMPLATES.find((item) => item.templateId === templateId)
    if (!template) {
      throw new Error('模板不存在')
    }
    template.templateName = data.templateName
    template.version = data.version
    template.outputFormat = data.outputFormat
    template.visibility = data.visibility
    template.isDefault = data.isDefault
    template.updatedAt = now
    delete template.isNewBlank
    delete template.copyFromTemplateId
  }

  if (data.visibility === 'project' && data.projectId) {
    MOCK_TEMPLATE_PROJECT_BINDINGS[targetId] = data.projectId
  } else {
    delete MOCK_TEMPLATE_PROJECT_BINDINGS[targetId]
  }

  setMockTemplateMarkdownContent(targetId, data.markdownContent)

  const existingExport = getMockTemplateExportSettings(targetId)
  setMockTemplateExportSettings(targetId, {
    roleRules: existingExport.roleRules,
    sensitiveFields: [...data.exportSettings.sensitiveFields],
    allowedFormats: [...data.exportSettings.allowedFormats],
    exportRequiresApproval: data.exportSettings.exportRequiresApproval,
    watermarkEnabled: data.exportSettings.watermarkEnabled,
    watermarkContent: data.exportSettings.watermarkContent,
    downloadScope: data.exportSettings.downloadScope,
    linkValidity: data.exportSettings.linkValidity,
    auditDownloadUser: data.exportSettings.auditDownloadUser,
    auditDownloadIp: data.exportSettings.auditDownloadIp,
  })

  const saved = getMockReportTemplateDetail(targetId)
  if (!saved) {
    throw new Error('保存后无法读取模板详情')
  }
  return saved
}
