import type { PageParams } from '@/types/common'

/** 报告模板发布状态 */
export type ReportTemplateStatus = 'draft' | 'published' | 'publish_failed'

/** 报告输出格式 */
export type ReportTemplateOutputFormat = 'pdf' | 'word' | 'html'

/** 模板可见范围 */
export type ReportTemplateVisibility = 'global' | 'project' | 'private'

/** 角色导出脱敏级别 */
export type ReportTemplateExportLevel = 'full' | 'partial' | 'strong'

/** 敏感字段 */
export type ReportTemplateSensitiveField = 'token' | 'email' | 'ip' | 'password'

/** 下载允许格式（导出 Tab 多选，与输出格式枚举一致） */
export type ReportTemplateDownloadFormat = ReportTemplateOutputFormat

/** 谁可下载 */
export type ReportTemplateDownloadScope = 'project_members' | 'all' | 'creator_owner'

/** 下载链接有效期 */
export type ReportTemplateLinkValidity = '24h' | '7d'

/** 按角色脱敏规则（只读展示） */
export interface ReportTemplateRoleDesensitizeRule {
  roleKey: string
  roleName: string
  exportLevel: ReportTemplateExportLevel
  description: string
}

/** 模板导出与权限配置 */
export interface ReportTemplateExportSettings {
  roleRules: ReportTemplateRoleDesensitizeRule[]
  sensitiveFields: ReportTemplateSensitiveField[]
  allowedFormats: ReportTemplateDownloadFormat[]
  exportRequiresApproval: boolean
  watermarkEnabled: boolean
  watermarkContent: string
  downloadScope: ReportTemplateDownloadScope
  linkValidity: ReportTemplateLinkValidity
  auditDownloadUser: boolean
  auditDownloadIp: boolean
}

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
  /** 新建时选择的复制来源模板 ID，详情接口据此合并源模板内容 */
  copyFromTemplateId?: string
  /** 新建空白模板（未选复制自），详情接口仅返回名称与默认版本 */
  isNewBlank?: boolean
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

/** 新建模板弹窗确认后带入编辑器的草稿参数（不发保存请求） */
export interface NewReportTemplateDraftParams {
  templateName: string
  /** 复制自某模板，空则空白模板 */
  copyFromTemplateId?: string
}

/** @deprecated 保存已移至编辑器页 saveReportTemplate，保留类型供联调参考 */
export interface CreateReportTemplateParams extends NewReportTemplateDraftParams {}

/** 保存模板时提交的导出与权限字段（不含只读 roleRules） */
export interface SaveReportTemplateExportPayload {
  sensitiveFields: ReportTemplateSensitiveField[]
  allowedFormats: ReportTemplateDownloadFormat[]
  exportRequiresApproval: boolean
  watermarkEnabled: boolean
  watermarkContent: string
  downloadScope: ReportTemplateDownloadScope
  linkValidity: ReportTemplateLinkValidity
  auditDownloadUser: boolean
  auditDownloadIp: boolean
}

/** 保存模板请求体（Markdown 正文为英文 varKey 占位符） */
export interface SaveReportTemplateParams {
  templateName: string
  version: string
  outputFormat: ReportTemplateOutputFormat
  visibility: ReportTemplateVisibility
  /** 可见范围为项目组可用时必填 */
  projectId?: string
  isDefault: boolean
  markdownContent: string
  exportSettings: SaveReportTemplateExportPayload
}

export interface ReportTemplatePublishFailureReason {
  templateId: string
  reason: string
}

/** 报告模板变量（后端返回英文键 + 中文展示名） */
export interface ReportTemplateVariable {
  /** 英文变量键，如 report_title */
  varKey: string
  /** 中文展示名，如 报告名称 */
  varLabel: string
}

/** 模板编辑器基本信息表单（保存接口待对接） */
export interface ReportTemplateEditorForm {
  templateName: string
  version: string
  outputFormat?: ReportTemplateOutputFormat
  visibility?: ReportTemplateVisibility
  /** 可见范围为项目组可用时必填 */
  projectId?: string
  isDefault?: boolean
}

/** 报告模板详情（编辑器页加载） */
export interface ReportTemplateDetail extends ReportTemplateEditorForm {
  templateId: string
  /** 绑定项目名称，用于 AsyncOptionsSelect 回填展示 */
  projectName?: string
  /** Markdown 模板正文，后续编辑器接入 */
  markdownContent: string
  /** 模板可用变量库（英文键 + 中文名） */
  variables: ReportTemplateVariable[]
  /** 导出与权限配置 */
  exportSettings: ReportTemplateExportSettings
  isSystem: boolean
  status: ReportTemplateStatus
  updatedAt: string
}
