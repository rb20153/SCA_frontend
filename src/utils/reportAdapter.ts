import type { PageResult } from '@/types/common'
import type {
  CreateReportDownloadParams,
  GenerateReportParams,
  Report,
  ReportDetail,
  ReportDownloadApprovalState,
  ReportDownloadInfo,
  ReportDownloadApplication,
  ReportDownloadStatus,
  ReportExportPolicyPreview,
  ReportFailureReason,
  ReportPreview,
  ReportPreviewFormat,
  ReportQueryParams,
  ReportStatus,
} from '@/types/report'
import type {
  NewReportTemplateDraftParams,
  ReportTemplate,
  ReportTemplateDetail,
  ReportTemplateDownloadFormat,
  ReportTemplateDownloadScope,
  ReportTemplateExportLevel,
  ReportTemplateExportSettings,
  ReportTemplateLinkValidity,
  ReportTemplateOutputFormat,
  ReportTemplatePublishFailureReason,
  ReportTemplateQueryParams,
  ReportTemplateRoleDesensitizeRule,
  ReportTemplateSensitiveField,
  ReportTemplateStatus,
  ReportTemplateVariable,
  ReportTemplateVisibility,
  SaveReportTemplateParams,
} from '@/types/reportTemplate'
import { normalizeList, normalizePageResult } from '@/utils/pageResultAdapter'
import {
  DEFAULT_REPORT_TEMPLATE_ROLE_RULES,
  createDefaultReportTemplateExportSettings,
} from '@/utils/reportTemplateExportDisplay'
import { convertMarkdownVariablesToChinese } from '@/utils/reportTemplateMarkdown'
import { DEFAULT_REPORT_TEMPLATE_VARIABLES } from '@/utils/reportTemplateVariables'

// ─── 通用小工具 ───────────────────────────────────────────────────────────────

/** 取第一个非空字符串；全为空时返回 fallback */
function pickFirstNonEmptyString(...candidates: unknown[]): string {
  for (const candidate of candidates) {
    const text = String(candidate ?? '').trim()
    if (text) {
      return text
    }
  }
  return ''
}

/** 把 camelCase / 大写枚举统一成小写下划线形式，便于比对后端各种写法 */
function toSnakeLower(raw: unknown): string {
  return String(raw ?? '')
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toLowerCase()
}

/** 宽松布尔解析：兼容 true / 'true' / 1 / '1' / 'Y' */
function normalizeBoolean(raw: unknown, fallback = false): boolean {
  if (raw === undefined || raw === null || raw === '') {
    return fallback
  }
  if (typeof raw === 'boolean') {
    return raw
  }
  const text = String(raw).trim().toLowerCase()
  if (text === 'false' || text === '0' || text === 'n' || text === 'no') {
    return false
  }
  if (text === 'true' || text === '1' || text === 'y' || text === 'yes') {
    return true
  }
  return fallback
}

/** 取对象形式的原始 payload（非对象时返回空对象，避免后续取值抛异常） */
function toRecord(raw: unknown): Record<string, unknown> {
  return (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
}

/** 解包可能被再包一层 data 的分页 payload */
function unwrapPageRaw(raw: unknown): unknown {
  if (Array.isArray(raw) || !raw || typeof raw !== 'object') {
    return raw
  }
  const obj = raw as Record<string, unknown>
  if (obj.list ?? obj.items ?? obj.records) {
    return obj
  }
  if (obj.data !== undefined) {
    return unwrapPageRaw(obj.data)
  }
  return obj
}

/** 从枚举白名单里取值，取不到时用 fallback */
function pickEnum<T extends string>(raw: unknown, allowed: readonly T[], fallback: T): T {
  const text = toSnakeLower(raw)
  return (allowed as readonly string[]).includes(text) ? (text as T) : fallback
}

/** 从枚举白名单里取值，取不到时返回 undefined（用于可选字段，不硬造默认值） */
function pickOptionalEnum<T extends string>(raw: unknown, allowed: readonly T[]): T | undefined {
  const text = toSnakeLower(raw)
  return (allowed as readonly string[]).includes(text) ? (text as T) : undefined
}

/** 过滤查询参数中的空值，避免把 '' 下发给后端 */
function compactQuery(params: Record<string, unknown>): Record<string, unknown> {
  const query: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') {
      continue
    }
    query[key] = value
  }
  return query
}

// ─── 报告列表 / 详情 ──────────────────────────────────────────────────────────

/** 后端报告状态别名 → 前端三态（completed / generating / failed） */
const REPORT_STATUS_ALIAS: Record<string, ReportStatus> = {
  completed: 'completed',
  complete: 'completed',
  success: 'completed',
  succeeded: 'completed',
  finished: 'completed',
  done: 'completed',
  generating: 'generating',
  generate: 'generating',
  running: 'generating',
  processing: 'generating',
  pending: 'generating',
  queued: 'generating',
  failed: 'failed',
  failure: 'failed',
  error: 'failed',
}

/** 规范报告生成状态，未知值按「生成中」处理（列表不会误显示可下载） */
function normalizeReportStatus(raw: unknown): ReportStatus {
  return REPORT_STATUS_ALIAS[toSnakeLower(raw)] ?? 'generating'
}

/**
 * 规范报告列表项 / 详情基础字段
 * @param raw - 后端单条报告对象
 */
export function normalizeReport(raw: Record<string, unknown>): Report {
  const downloadUrl = pickFirstNonEmptyString(raw.downloadUrl, raw.download_url, raw.url)

  return {
    reportId: pickFirstNonEmptyString(raw.reportId, raw.report_id, raw.id),
    reportName: pickFirstNonEmptyString(raw.reportName, raw.report_name, raw.name),
    projectName: pickFirstNonEmptyString(raw.projectName, raw.project_name),
    templateName: pickFirstNonEmptyString(raw.templateName, raw.template_name),
    generatedAt: pickFirstNonEmptyString(
      raw.generatedAt,
      raw.generated_at,
      raw.createdAt,
      raw.created_at,
      raw.generateTime,
    ),
    status: normalizeReportStatus(raw.status ?? raw.reportStatus ?? raw.report_status),
    ...(downloadUrl ? { downloadUrl } : {}),
  }
}

/**
 * 规范报告列表分页结果
 * @param raw - 后端分页 payload（兼容 list/items/records）
 */
export function normalizeReportPage(raw: unknown): PageResult<Report> {
  return normalizePageResult(unwrapPageRaw(raw), normalizeReport)
}

/**
 * 规范报告详情（抽屉元信息）
 * @param raw - 后端详情对象
 * @param fallbackReport - 当前列表项；后端缺关联项目或模板时用于展示兜底
 */
export function normalizeReportDetail(raw: unknown, fallbackReport: Report): ReportDetail {
  const detail = normalizeReport(toRecord(raw))
  return {
    ...detail,
    reportId: detail.reportId || fallbackReport.reportId,
    projectName: detail.projectName || fallbackReport.projectName,
    templateName: detail.templateName || fallbackReport.templateName,
  }
}

/**
 * 规范报告在线预览信息
 * @param raw - 后端预览对象
 * @param reportId - 报告 ID（兜底）
 * 说明：url 可能是相对路径（/api/...），由 iframe 直接加载，鉴权靠 Cookie 或后端签名链接
 */
export function normalizeReportPreview(raw: unknown, reportId: string): ReportPreview {
  const obj = toRecord(raw)
  const url = pickFirstNonEmptyString(obj.url, obj.previewUrl, obj.preview_url, obj.fileUrl)
  const format = pickEnum<ReportPreviewFormat>(
    obj.format ?? obj.previewFormat ?? obj.preview_format,
    ['pdf', 'html'],
    // 后端没给格式时按扩展名兜底，避免 viewer 直接空白
    url.toLowerCase().endsWith('.html') ? 'html' : 'pdf',
  )

  return {
    reportId: pickFirstNonEmptyString(obj.reportId, obj.report_id, reportId),
    format,
    url,
    fileName: pickFirstNonEmptyString(obj.fileName, obj.file_name, obj.filename),
  }
}

/** 规范导出策略摘要（下载弹窗顶部 alert 展示，缺字段用 — 占位） */
function normalizeReportExportPolicy(raw: unknown): ReportExportPolicyPreview {
  const obj = toRecord(raw)
  return {
    policyName: pickFirstNonEmptyString(obj.policyName, obj.policy_name) || '—',
    desensitizeRoleLabel:
      pickFirstNonEmptyString(obj.desensitizeRoleLabel, obj.desensitize_role_label, obj.roleLabel) ||
      '—',
    desensitizeLevel:
      pickFirstNonEmptyString(obj.desensitizeLevel, obj.desensitize_level, obj.level) || '—',
    watermarkPreview:
      pickFirstNonEmptyString(obj.watermarkPreview, obj.watermark_preview, obj.watermark) || '—',
  }
}

/**
 * 规范下载审批状态
 * @param raw - 后端 download-status 对象
 * @param reportId - 报告 ID（兜底）
 * requiresApproval 后端未返回时，由 approvalState 反推（非 not_required 即需审批）
 */
export function normalizeReportDownloadStatus(
  raw: unknown,
  reportId: string,
): ReportDownloadStatus {
  const obj = toRecord(raw)
  const approvalState = pickEnum<ReportDownloadApprovalState>(
    obj.approvalState ?? obj.approval_state ?? obj.state,
    ['not_required', 'pending_submit', 'pending_review', 'approved', 'rejected'],
    'not_required',
  )
  const requiresApprovalRaw = obj.requiresApproval ?? obj.requires_approval ?? obj.needApproval

  return {
    reportId: pickFirstNonEmptyString(obj.reportId, obj.report_id, reportId),
    requiresApproval: normalizeBoolean(requiresApprovalRaw, approvalState !== 'not_required'),
    approvalState,
    exportPolicy: normalizeReportExportPolicy(obj.exportPolicy ?? obj.export_policy),
  }
}

/**
 * 规范报告下载申请，兼容后端 camelCase / snake_case 字段。
 * 审批抽屉只消费该标准结构，避免接口联调时直接把后端字段泄漏到组件。
 */
export function normalizeReportDownloadApplication(raw: unknown): ReportDownloadApplication {
  const obj = toRecord(raw)
  return {
    applicationId: pickFirstNonEmptyString(obj.applicationId, obj.application_id, obj.id),
    reportId: pickFirstNonEmptyString(obj.reportId, obj.report_id),
    applicantId: pickFirstNonEmptyString(obj.applicantId, obj.applicant_id, obj.userId, obj.user_id),
    applicantName: pickFirstNonEmptyString(
      obj.applicantName,
      obj.applicant_name,
      obj.applicant,
      obj.userName,
      obj.user_name,
    ),
    reason: pickFirstNonEmptyString(obj.reason, obj.applicationReason, obj.application_reason),
    format: pickEnum<ReportDownloadApplication['format']>(
      obj.format,
      ['pdf', 'word', 'html'],
      'pdf',
    ),
    includeEvidenceChain: normalizeBoolean(
      obj.includeEvidenceChain ?? obj.include_evidence_chain,
    ),
    status: pickEnum<ReportDownloadApplication['status']>(
      obj.status ?? obj.approvalState ?? obj.approval_state,
      ['pending_review', 'approved', 'rejected'],
      'pending_review',
    ),
    approvalOpinion: pickFirstNonEmptyString(
      obj.approvalOpinion,
      obj.approval_opinion,
      obj.opinion,
    ),
    createdAt: pickFirstNonEmptyString(obj.createdAt, obj.created_at, obj.appliedAt, obj.applied_at),
    ...(pickFirstNonEmptyString(obj.processedAt, obj.processed_at, obj.approvedAt, obj.approved_at)
      ? { processedAt: pickFirstNonEmptyString(obj.processedAt, obj.processed_at, obj.approvedAt, obj.approved_at) }
      : {}),
  }
}

/**
 * 规范下载任务返回（临时链接 + 建议文件名）
 * @param raw - 后端 downloads 响应
 * @param fallbackFileName - 后端未返回文件名时的兜底名
 * 兼容后端把地址放在 url / download_url 字段的情况（与系统日志导出一致）
 */
export function normalizeReportDownloadInfo(
  raw: unknown,
  fallbackFileName: string,
): ReportDownloadInfo {
  const obj = toRecord(raw)
  return {
    downloadUrl: pickFirstNonEmptyString(obj.downloadUrl, obj.download_url, obj.url, obj.fileUrl),
    fileName:
      pickFirstNonEmptyString(obj.fileName, obj.file_name, obj.filename) || fallbackFileName,
  }
}

/**
 * 规范报告生成失败原因
 * @param raw - 后端 failure-reason 对象
 * @param reportId - 报告 ID（兜底）
 */
export function normalizeReportFailureReason(raw: unknown, reportId: string): ReportFailureReason {
  const obj = toRecord(raw)
  return {
    reportId: pickFirstNonEmptyString(obj.reportId, obj.report_id, reportId),
    reason: pickFirstNonEmptyString(obj.reason, obj.failureReason, obj.failure_reason, obj.message),
  }
}

/**
 * 报告列表查询参数 → 后端 query（空值不下发）
 * @param params - 分页与筛选参数
 */
export function reportQueryParamsToApi(params: ReportQueryParams): Record<string, unknown> {
  return compactQuery({
    reportId: params.reportId,
    reportName: params.reportName?.trim(),
    projectName: params.projectName?.trim(),
    generatedDate: params.generatedDate,
    page: params.page,
    pageSize: params.pageSize,
  })
}

/**
 * 生成报告请求体 → 后端 body
 * @param data - 项目、任务与模板 ID
 */
export function generateReportParamsToApi(data: GenerateReportParams): Record<string, unknown> {
  return {
    projectId: data.projectId,
    taskId: data.taskId,
    templateId: data.templateId,
  }
}

/**
 * 创建下载任务请求体 → 后端 body
 * @param params - 导出格式与是否包含证据链
 */
export function createReportDownloadParamsToApi(
  params: CreateReportDownloadParams,
): Record<string, unknown> {
  return {
    format: params.format,
    includeEvidenceChain: params.includeEvidenceChain,
    ...(params.applicationId ? { applicationId: params.applicationId } : {}),
  }
}

/**
 * 生成下载文件名兜底值（后端未返回 fileName 时使用）
 * @param reportName - 报告名称
 * @param params - 导出格式与是否含证据链（含证据链打包为 zip）
 */
export function buildReportDownloadFallbackFileName(
  reportName: string,
  params: CreateReportDownloadParams,
): string {
  const safeName = (reportName || 'report').replace(/[\\/:*?"<>|]/g, '_')
  if (params.includeEvidenceChain) {
    return `${safeName}.zip`
  }
  const ext = params.format === 'word' ? 'docx' : params.format
  return `${safeName}.${ext}`
}

// ─── 报告模板 ─────────────────────────────────────────────────────────────────

const TEMPLATE_OUTPUT_FORMATS: readonly ReportTemplateOutputFormat[] = ['pdf', 'word', 'html']
const TEMPLATE_VISIBILITIES: readonly ReportTemplateVisibility[] = ['global', 'project', 'private']
const TEMPLATE_STATUSES: readonly ReportTemplateStatus[] = ['draft', 'published', 'publish_failed']
const TEMPLATE_SENSITIVE_FIELDS: readonly ReportTemplateSensitiveField[] = [
  'token',
  'email',
  'ip',
  'password',
]
const TEMPLATE_DOWNLOAD_SCOPES: readonly ReportTemplateDownloadScope[] = [
  'project_members',
  'all',
  'creator_owner',
]
const TEMPLATE_EXPORT_LEVELS: readonly ReportTemplateExportLevel[] = ['full', 'partial', 'strong']

/** 规范模板发布状态，兼容后端 failed / unpublished 等写法 */
function normalizeTemplateStatus(raw: unknown): ReportTemplateStatus {
  const text = toSnakeLower(raw)
  if (text === 'failed' || text === 'publish_fail') {
    return 'publish_failed'
  }
  if (text === 'unpublished') {
    return 'draft'
  }
  return pickEnum<ReportTemplateStatus>(text, TEMPLATE_STATUSES, 'draft')
}

/**
 * 规范报告模板列表项
 * @param raw - 后端单条模板对象
 */
export function normalizeReportTemplate(raw: Record<string, unknown>): ReportTemplate {
  return {
    templateId: pickFirstNonEmptyString(raw.templateId, raw.template_id, raw.id),
    templateName: pickFirstNonEmptyString(raw.templateName, raw.template_name, raw.name),
    version: pickFirstNonEmptyString(raw.version, raw.templateVersion, raw.template_version),
    outputFormat: pickEnum<ReportTemplateOutputFormat>(
      raw.outputFormat ?? raw.output_format,
      TEMPLATE_OUTPUT_FORMATS,
      'pdf',
    ),
    visibility: pickEnum<ReportTemplateVisibility>(
      raw.visibility ?? raw.visibleScope ?? raw.visible_scope,
      TEMPLATE_VISIBILITIES,
      'global',
    ),
    isDefault: normalizeBoolean(raw.isDefault ?? raw.is_default),
    isSystem: normalizeBoolean(raw.isSystem ?? raw.is_system ?? raw.builtIn ?? raw.built_in),
    status: normalizeTemplateStatus(raw.status ?? raw.templateStatus ?? raw.template_status),
    updatedAt: pickFirstNonEmptyString(
      raw.updatedAt,
      raw.updated_at,
      raw.updateTime,
      raw.modifiedAt,
    ),
  }
}

/**
 * 规范模板列表分页结果
 * @param raw - 后端分页 payload
 */
export function normalizeReportTemplatePage(raw: unknown): PageResult<ReportTemplate> {
  return normalizePageResult(unwrapPageRaw(raw), normalizeReportTemplate)
}

/** 规范单个模板变量（英文 varKey + 中文展示名） */
function normalizeReportTemplateVariable(raw: Record<string, unknown>): ReportTemplateVariable {
  return {
    varKey: pickFirstNonEmptyString(raw.varKey, raw.var_key, raw.key, raw.name),
    varLabel: pickFirstNonEmptyString(raw.varLabel, raw.var_label, raw.label, raw.title),
  }
}

/**
 * 规范模板变量库
 * @param raw - 后端 variables 数组
 * 只保留 varKey / varLabel 都有值的项，避免编辑器插入空占位符
 */
export function normalizeReportTemplateVariables(raw: unknown): ReportTemplateVariable[] {
  return normalizeList(raw, normalizeReportTemplateVariable).filter(
    (item) => item.varKey && item.varLabel,
  )
}

/** 规范按角色脱敏规则（只读展示） */
function normalizeRoleDesensitizeRule(
  raw: Record<string, unknown>,
): ReportTemplateRoleDesensitizeRule {
  return {
    roleKey: pickFirstNonEmptyString(raw.roleKey, raw.role_key, raw.key),
    roleName: pickFirstNonEmptyString(raw.roleName, raw.role_name, raw.name),
    exportLevel: pickEnum<ReportTemplateExportLevel>(
      raw.exportLevel ?? raw.export_level ?? raw.level,
      TEMPLATE_EXPORT_LEVELS,
      'partial',
    ),
    description: pickFirstNonEmptyString(raw.description, raw.desc, raw.remark),
  }
}

/** 从后端数组中取出白名单内的枚举值，结果为空时用默认值 */
function normalizeEnumArray<T extends string>(
  raw: unknown,
  allowed: readonly T[],
  fallback: T[],
): T[] {
  if (!Array.isArray(raw)) {
    return fallback
  }
  const picked = raw
    .map((item) => toSnakeLower(item))
    .filter((item): item is T => (allowed as readonly string[]).includes(item))
  return picked.length > 0 ? picked : fallback
}

/**
 * 规范模板导出与权限配置
 * @param raw - 后端 exportSettings 对象
 * 缺字段时回落到 createDefaultReportTemplateExportSettings()，保证导出 Tab 表单可用
 */
export function normalizeReportTemplateExportSettings(
  raw: unknown,
): ReportTemplateExportSettings {
  const defaults = createDefaultReportTemplateExportSettings()
  const obj = toRecord(raw)

  const roleRulesRaw = obj.roleRules ?? obj.role_rules
  const roleRules = Array.isArray(roleRulesRaw)
    ? normalizeList(roleRulesRaw, normalizeRoleDesensitizeRule).filter((item) => item.roleKey)
    : []

  const allowedFormatsRaw = obj.allowedFormats ?? obj.allowed_formats
  const watermarkContent = pickFirstNonEmptyString(obj.watermarkContent, obj.watermark_content)

  return {
    roleRules:
      roleRules.length > 0
        ? roleRules
        : DEFAULT_REPORT_TEMPLATE_ROLE_RULES.map((item) => ({ ...item })),
    sensitiveFields: normalizeEnumArray<ReportTemplateSensitiveField>(
      obj.sensitiveFields ?? obj.sensitive_fields,
      TEMPLATE_SENSITIVE_FIELDS,
      defaults.sensitiveFields,
    ),
    allowedFormats: normalizeEnumArray<ReportTemplateDownloadFormat>(
      allowedFormatsRaw,
      TEMPLATE_OUTPUT_FORMATS,
      defaults.allowedFormats,
    ),
    exportRequiresApproval: normalizeBoolean(
      obj.exportRequiresApproval ?? obj.export_requires_approval,
      defaults.exportRequiresApproval,
    ),
    watermarkEnabled: normalizeBoolean(
      obj.watermarkEnabled ?? obj.watermark_enabled,
      defaults.watermarkEnabled,
    ),
    watermarkContent: watermarkContent || defaults.watermarkContent,
    downloadScope: pickEnum<ReportTemplateDownloadScope>(
      obj.downloadScope ?? obj.download_scope,
      TEMPLATE_DOWNLOAD_SCOPES,
      defaults.downloadScope,
    ),
    linkValidity: pickEnum<ReportTemplateLinkValidity>(
      obj.linkValidity ?? obj.link_validity,
      ['24h', '7d'],
      defaults.linkValidity,
    ),
    auditDownloadUser: normalizeBoolean(
      obj.auditDownloadUser ?? obj.audit_download_user,
      defaults.auditDownloadUser,
    ),
    auditDownloadIp: normalizeBoolean(
      obj.auditDownloadIp ?? obj.audit_download_ip,
      defaults.auditDownloadIp,
    ),
  }
}

/**
 * 规范模板详情（编辑器页加载）
 * @param raw - 后端详情对象，空对象/非对象视为「模板不存在」返回 null
 * @param templateId - 路由携带的模板 ID（兜底）
 * 后端存英文 varKey，编辑器展示中文变量名，这里按 variables 做一次英文→中文转换，
 * 保存时页面再用 convertMarkdownVariablesToEnglish 转回去，形成闭环
 */
export function normalizeReportTemplateDetail(
  raw: unknown,
  templateId: string,
): ReportTemplateDetail | null {
  if (!raw || typeof raw !== 'object' || Object.keys(raw).length === 0) {
    return null
  }

  const obj = raw as Record<string, unknown>
  // 后端未返回 variables 时用默认变量库兜底，避免中英变量转换静默失效、变量面板空白
  const parsedVariables = normalizeReportTemplateVariables(
    obj.variables ?? obj.variableList ?? obj.variable_list,
  )
  const variables =
    parsedVariables.length > 0 ? parsedVariables : [...DEFAULT_REPORT_TEMPLATE_VARIABLES]
  const markdownRaw = pickFirstNonEmptyString(
    obj.markdownContent,
    obj.markdown_content,
    obj.content,
    obj.markdown,
  )
  const isDefaultRaw = obj.isDefault ?? obj.is_default
  const projectId = pickFirstNonEmptyString(obj.projectId, obj.project_id)
  const projectName = pickFirstNonEmptyString(obj.projectName, obj.project_name)

  return {
    templateId: pickFirstNonEmptyString(obj.templateId, obj.template_id, obj.id, templateId),
    templateName: pickFirstNonEmptyString(obj.templateName, obj.template_name, obj.name),
    version: pickFirstNonEmptyString(obj.version, obj.templateVersion, obj.template_version),
    outputFormat: pickOptionalEnum<ReportTemplateOutputFormat>(
      obj.outputFormat ?? obj.output_format,
      TEMPLATE_OUTPUT_FORMATS,
    ),
    visibility: pickOptionalEnum<ReportTemplateVisibility>(
      obj.visibility ?? obj.visibleScope ?? obj.visible_scope,
      TEMPLATE_VISIBILITIES,
    ),
    ...(projectId ? { projectId } : {}),
    ...(projectName ? { projectName } : {}),
    isDefault: isDefaultRaw === undefined ? undefined : normalizeBoolean(isDefaultRaw),
    markdownContent: convertMarkdownVariablesToChinese(markdownRaw, variables),
    variables,
    exportSettings: normalizeReportTemplateExportSettings(
      obj.exportSettings ?? obj.export_settings,
    ),
    isSystem: normalizeBoolean(obj.isSystem ?? obj.is_system ?? obj.builtIn ?? obj.built_in),
    status: normalizeTemplateStatus(obj.status ?? obj.templateStatus ?? obj.template_status),
    updatedAt: pickFirstNonEmptyString(obj.updatedAt, obj.updated_at, obj.updateTime),
  }
}

/**
 * 后端草稿预览接口无返回内容时的兜底详情（保证编辑器仍可用空白模板开工）
 * @param draft - 新建弹窗带入的模板名称
 */
export function createNewReportTemplateDetailFallback(
  draft: NewReportTemplateDraftParams,
): ReportTemplateDetail {
  return {
    templateId: 'new',
    templateName: draft.templateName.trim(),
    version: '',
    markdownContent: '',
    variables: [...DEFAULT_REPORT_TEMPLATE_VARIABLES],
    exportSettings: createDefaultReportTemplateExportSettings(),
    isSystem: false,
    status: 'draft',
    updatedAt: '',
  }
}

/**
 * 规范模板发布失败原因
 * @param raw - 后端 publish-failure-reason 对象
 * @param templateId - 模板 ID（兜底）
 */
export function normalizeReportTemplatePublishFailureReason(
  raw: unknown,
  templateId: string,
): ReportTemplatePublishFailureReason {
  const obj = toRecord(raw)
  return {
    templateId: pickFirstNonEmptyString(obj.templateId, obj.template_id, templateId),
    reason: pickFirstNonEmptyString(obj.reason, obj.failureReason, obj.failure_reason, obj.message),
  }
}

/**
 * 模板列表查询参数 → 后端 query（空值不下发）
 * @param params - 分页与筛选参数
 */
export function reportTemplateQueryParamsToApi(
  params: ReportTemplateQueryParams,
): Record<string, unknown> {
  return compactQuery({
    templateName: params.templateName?.trim(),
    outputFormat: params.outputFormat,
    visibility: params.visibility,
    status: params.status,
    page: params.page,
    pageSize: params.pageSize,
  })
}

/**
 * 新建模板草稿请求体 → 后端 body
 * @param draft - 模板名称与复制来源模板 ID
 */
export function newReportTemplateDraftParamsToApi(
  draft: NewReportTemplateDraftParams,
): Record<string, unknown> {
  return compactQuery({
    templateName: draft.templateName.trim(),
    copyFromTemplateId: draft.copyFromTemplateId,
  })
}

/**
 * 保存模板请求体 → 后端 body
 * @param data - 基本信息 + Markdown（英文 varKey）+ 导出与权限配置
 * visibility 非 project 时不下发 projectId，避免后端存下无效绑定
 */
export function saveReportTemplateParamsToApi(
  data: SaveReportTemplateParams,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    templateName: data.templateName.trim(),
    version: data.version.trim(),
    outputFormat: data.outputFormat,
    visibility: data.visibility,
    isDefault: data.isDefault,
    markdownContent: data.markdownContent,
    exportSettings: {
      sensitiveFields: [...data.exportSettings.sensitiveFields],
      allowedFormats: [...data.exportSettings.allowedFormats],
      exportRequiresApproval: data.exportSettings.exportRequiresApproval,
      watermarkEnabled: data.exportSettings.watermarkEnabled,
      watermarkContent: data.exportSettings.watermarkContent,
      downloadScope: data.exportSettings.downloadScope,
      linkValidity: data.exportSettings.linkValidity,
      auditDownloadUser: data.exportSettings.auditDownloadUser,
      auditDownloadIp: data.exportSettings.auditDownloadIp,
    },
  }

  if (data.visibility === 'project' && data.projectId) {
    body.projectId = data.projectId
  }

  return body
}
