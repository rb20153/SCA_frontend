import type { SelectOption } from '@/types/common'
import type {
  ReportTemplateDownloadFormat,
  ReportTemplateDownloadScope,
  ReportTemplateExportLevel,
  ReportTemplateExportSettings,
  ReportTemplateLinkValidity,
  ReportTemplateRoleDesensitizeRule,
  ReportTemplateSensitiveField,
} from '@/types/reportTemplate'

/** 按角色脱敏默认规则（只读展示） */
export const DEFAULT_REPORT_TEMPLATE_ROLE_RULES: ReportTemplateRoleDesensitizeRule[] = [
  {
    roleKey: 'admin',
    roleName: '管理员',
    exportLevel: 'full',
    description: '可见原始路径/证据',
  },
  {
    roleKey: 'engineer',
    roleName: '检测工程师',
    exportLevel: 'partial',
    description: '隐藏 Token/IP 等',
  },
  {
    roleKey: 'auditor',
    roleName: '审计员',
    exportLevel: 'strong',
    description: '仅汇总与统计',
  },
  {
    roleKey: 'readonly',
    roleName: '只读',
    exportLevel: 'strong',
    description: '仅结论卡片',
  },
]

/** 返回导出与权限默认配置（空白新建模板） */
export function createDefaultReportTemplateExportSettings(): ReportTemplateExportSettings {
  return {
    roleRules: DEFAULT_REPORT_TEMPLATE_ROLE_RULES.map((item) => ({ ...item })),
    sensitiveFields: ['token', 'email', 'ip', 'password'],
    allowedFormats: ['pdf', 'word', 'html'],
    exportRequiresApproval: true,
    watermarkEnabled: true,
    watermarkContent: '机密｜{user}｜{project}｜{time}',
    downloadScope: 'project_members',
    linkValidity: '24h',
    auditDownloadUser: true,
    auditDownloadIp: true,
  }
}

export const REPORT_TEMPLATE_EXPORT_LEVEL_LABEL: Record<ReportTemplateExportLevel, string> = {
  full: '全量',
  partial: '部分脱敏',
  strong: '强脱敏',
}

export const REPORT_TEMPLATE_EXPORT_LEVEL_COLOR: Record<ReportTemplateExportLevel, string> = {
  full: 'success',
  partial: 'warning',
  strong: 'error',
}

export const REPORT_TEMPLATE_SENSITIVE_FIELD_LABEL: Record<ReportTemplateSensitiveField, string> = {
  token: 'token',
  email: 'email',
  ip: 'ip',
  password: 'password',
}

export const REPORT_TEMPLATE_DOWNLOAD_FORMAT_LABEL: Record<ReportTemplateDownloadFormat, string> = {
  pdf: 'PDF',
  word: 'Word',
  html: 'HTML',
}

export const REPORT_TEMPLATE_DOWNLOAD_SCOPE_LABEL: Record<ReportTemplateDownloadScope, string> = {
  project_members: '项目成员',
  all: '全部人员',
  creator_owner: '仅创建者与负责人',
}

export const REPORT_TEMPLATE_LINK_VALIDITY_LABEL: Record<ReportTemplateLinkValidity, string> = {
  '24h': '24 小时',
  '7d': '7 天',
}

/** 敏感字段多选选项 */
export const REPORT_TEMPLATE_SENSITIVE_FIELD_OPTIONS: SelectOption[] = (
  ['token', 'email', 'ip', 'password'] as ReportTemplateSensitiveField[]
).map((value) => ({
  label: REPORT_TEMPLATE_SENSITIVE_FIELD_LABEL[value],
  value,
}))

/** 允许格式多选选项 */
export const REPORT_TEMPLATE_ALLOWED_FORMAT_OPTIONS: SelectOption[] = (
  ['pdf', 'word', 'html'] as ReportTemplateDownloadFormat[]
).map((value) => ({
  label: REPORT_TEMPLATE_DOWNLOAD_FORMAT_LABEL[value],
  value,
}))

/** 导出需审批下拉 */
export const REPORT_TEMPLATE_EXPORT_APPROVAL_OPTIONS: SelectOption[] = [
  { label: '是（通知审计员）', value: 'true' },
  { label: '否', value: 'false' },
]

/** 水印开关下拉 */
export const REPORT_TEMPLATE_WATERMARK_OPTIONS: SelectOption[] = [
  { label: '开启', value: 'true' },
  { label: '关闭', value: 'false' },
]

/** 谁可下载下拉 */
export const REPORT_TEMPLATE_DOWNLOAD_SCOPE_OPTIONS: SelectOption[] = (
  ['project_members', 'all', 'creator_owner'] as ReportTemplateDownloadScope[]
).map((value) => ({
  label: REPORT_TEMPLATE_DOWNLOAD_SCOPE_LABEL[value],
  value,
}))

/** 链接有效期下拉 */
export const REPORT_TEMPLATE_LINK_VALIDITY_OPTIONS: SelectOption[] = (
  ['24h', '7d'] as ReportTemplateLinkValidity[]
).map((value) => ({
  label: REPORT_TEMPLATE_LINK_VALIDITY_LABEL[value],
  value,
}))

/** 返回默认导出与权限配置 */
export function createEmptyReportTemplateExportSettings(): ReportTemplateExportSettings {
  return createDefaultReportTemplateExportSettings()
}

/** 深拷贝导出配置，避免表单直接修改 mock 引用 */
export function cloneReportTemplateExportSettings(
  settings: ReportTemplateExportSettings,
): ReportTemplateExportSettings {
  return {
    ...settings,
    roleRules: settings.roleRules.map((item) => ({ ...item })),
    sensitiveFields: [...settings.sensitiveFields],
    allowedFormats: [...settings.allowedFormats],
  }
}
