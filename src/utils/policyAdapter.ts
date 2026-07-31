import type { PageResult } from '@/types/common'
import type {
  ExportPolicyVersionParams,
  Policy,
  PolicyDetectParams,
  PolicyEditorContent,
  PolicyGovernanceOverview,
  PolicyMaskingAction,
  PolicyRuleHitDetail,
  PolicyRuleHitListItem,
  PolicyRuleHitScope,
  PolicyVersionApprovalConclusion,
  PolicyVersionDiffExportResult,
  PolicyVersionDiffResult,
  PolicyVersionDiffSide,
  PolicyVersionEffectiveTime,
  PolicyVersionExportResult,
  PolicyVersionListItem,
  PolicyVersionStatus,
  RollbackPolicyVersionParams,
  SubmitPolicyPublishParams,
  SubmitPolicyPublishResult,
  SubmitPolicyVersionApprovalParams,
  SubmitPolicyVersionApprovalResult,
} from '@/types/policy'
import { normalizeList, normalizePageResult } from '@/utils/pageResultAdapter'

/** 取第一个非空字符串，全空时返回 fallback */
function pickFirstNonEmptyString(candidates: unknown[], fallback = ''): string {
  for (const candidate of candidates) {
    const text = String(candidate ?? '').trim()
    if (text) {
      return text
    }
  }
  return fallback
}

/** 收窄为对象；非对象（含数组、null）返回 null */
function toRecord(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null
  }
  return raw as Record<string, unknown>
}

/** 把后端枚举文本统一为前端的小写连字符形式（如 SUMMARY_ONLY → summary-only） */
function toEnumToken(raw: unknown): string {
  return String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/_/g, '-')
}

/** 将后端策略选项规范为前端 Policy */
export function normalizePolicy(raw: Record<string, unknown>): Policy {
  return {
    policyId: pickFirstNonEmptyString([raw.policyId, raw.policy_id, raw.id]),
    policyName: pickFirstNonEmptyString([raw.policyName, raw.policy_name, raw.name]),
    scenarioDescription: pickFirstNonEmptyString([
      raw.scenarioDescription,
      raw.scenario_description,
      raw.description,
      raw.scenario,
    ]),
    referencedProjectCount: Number(
      raw.referencedProjectCount ?? raw.referenced_project_count ?? raw.projectCount ?? 0,
    ),
    isDefault: Boolean(raw.isDefault ?? raw.is_default ?? raw.default ?? false),
    updatedAt: pickFirstNonEmptyString([raw.updatedAt, raw.updated_at]),
  }
}

/** 规范策略下拉列表 */
export function normalizePolicyList(raw: unknown): Policy[] {
  return normalizeList(raw, normalizePolicy)
}

/** 规范策略列表分页结果 */
export function normalizePolicyPage(raw: unknown): PageResult<Policy> {
  return normalizePageResult(raw, normalizePolicy)
}

/** 规范策略详情；缺 policyId 时按“查不到”返回 null，由页面走兜底逻辑 */
export function normalizePolicyDetail(raw: unknown): Policy | null {
  const obj = toRecord(raw)
  if (!obj) return null

  const policy = normalizePolicy(obj)
  return policy.policyId ? policy : null
}

/** 将 0–1 小数或 0–100 整数统一为前端表单使用的 0–100 阈值 */
function normalizeSimilarityThresholdPercent(raw: unknown): number {
  const value = Number(raw)
  if (Number.isNaN(value)) return NaN
  if (value > 0 && value <= 1) {
    return Math.round(value * 1000) / 10
  }
  return value
}

/** 解析最小匹配长度：后端可能放在 minMatchLines，minMatchLength 为 0 占位 */
function normalizeMinMatchLength(obj: Record<string, unknown>): number {
  const direct = Number(obj.minMatchLength ?? obj.min_match_length ?? obj.minMatchLen)
  if (!Number.isNaN(direct) && direct > 0) {
    return direct
  }
  const lines = Number(obj.minMatchLines ?? obj.min_match_lines)
  if (!Number.isNaN(lines) && lines > 0) {
    return lines
  }
  const tokens = Number(obj.minMatchTokens ?? obj.min_match_tokens)
  if (!Number.isNaN(tokens) && tokens > 0) {
    return tokens
  }
  return Number.isNaN(direct) ? NaN : direct
}

/** 解析排除目录：后端常用 excludeDirs，契约字段为 excludeDirectories */
function normalizeExcludeDirectories(obj: Record<string, unknown>): string[] {
  const candidates = [
    obj.excludeDirectories,
    obj.excludeDirs,
    obj.exclude_directories,
    obj.excludedFolders,
  ]
  for (const item of candidates) {
    if (Array.isArray(item) && item.length > 0) {
      return item.map((dir) => String(dir))
    }
  }
  return []
}

/** 将后端策略检测参数规范为 PolicyDetectParams */
export function normalizePolicyDetectParams(raw: unknown): PolicyDetectParams | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>

  const similarityThreshold = normalizeSimilarityThresholdPercent(
    obj.similarityThreshold ?? obj.similarity_threshold ?? obj.suspectThreshold ?? obj.threshold,
  )
  const minMatchLength = normalizeMinMatchLength(obj)
  const excludeDirectories = normalizeExcludeDirectories(obj)

  if (Number.isNaN(similarityThreshold) || Number.isNaN(minMatchLength)) {
    return null
  }

  return {
    similarityThreshold,
    minMatchLength,
    excludeDirectories,
  }
}

// ─── 策略编辑器 ───────────────────────────────────────────────────────────────

/** 读取配置文本：后端可能直接返回 JSON 对象而非字符串，此时序列化后交给编辑器 */
function readPolicyConfigText(obj: Record<string, unknown>): string {
  const candidates = [obj.configText, obj.config_text, obj.content, obj.config]
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate
    }
    if (candidate && typeof candidate === 'object') {
      return JSON.stringify(candidate, null, 2)
    }
  }
  return ''
}

/**
 * 规范策略编辑器初始内容
 * 配置文本为空视为加载失败（返回 null），页面据此展示重试态
 */
export function normalizePolicyEditorContent(raw: unknown): PolicyEditorContent | null {
  const obj = toRecord(raw)
  if (!obj) return null

  const configText = readPolicyConfigText(obj)
  if (!configText) return null

  const currentVersion = pickFirstNonEmptyString([
    obj.currentVersion,
    obj.current_version,
    obj.versionNo,
    obj.version_no,
  ])

  return {
    configText,
    // 新建策略后端返回 null / 空串，前端统一用 null 表示“尚无生效版本”
    currentVersion: currentVersion || null,
  }
}

/**
 * 提交发布申请请求体（policyId 走 path，不重复放 body）
 * @param params - 版本号、变更摘要、配置全文与编辑人 ID
 */
export function submitPolicyPublishParamsToApi(
  params: SubmitPolicyPublishParams,
): Record<string, unknown> {
  return {
    versionNo: params.versionNo,
    changeSummary: params.changeSummary,
    configText: params.configText,
    editorId: params.editorId,
  }
}

/**
 * 规范发布申请响应；后端只回 versionId 时用请求参数兜住 policyId / versionNo
 * @param raw - 后端 data
 * @param params - 本次提交参数，用于缺字段兜底
 */
export function normalizeSubmitPolicyPublishResult(
  raw: unknown,
  params: SubmitPolicyPublishParams,
): SubmitPolicyPublishResult {
  const obj = toRecord(raw) ?? {}
  return {
    policyId: pickFirstNonEmptyString([obj.policyId, obj.policy_id, obj.id], params.policyId),
    versionId: pickFirstNonEmptyString([obj.versionId, obj.version_id]),
    versionNo: pickFirstNonEmptyString([obj.versionNo, obj.version_no], params.versionNo),
  }
}

// ─── 规则命中追溯 ─────────────────────────────────────────────────────────────

const POLICY_RULE_HIT_SCOPES: PolicyRuleHitScope[] = ['source', 'binary', 'report-export']

const POLICY_MASKING_ACTIONS: PolicyMaskingAction[] = [
  'replace',
  'summary-only',
  'block',
  'watermark',
]

/** 规范命中范围；未知值降级为 source，避免表格渲染出空标签 */
function normalizePolicyRuleHitScope(raw: unknown): PolicyRuleHitScope {
  const token = toEnumToken(raw)
  return POLICY_RULE_HIT_SCOPES.find((scope) => scope === token) ?? 'source'
}

/** 规范脱敏动作；未知值降级为 replace */
function normalizePolicyMaskingAction(raw: unknown): PolicyMaskingAction {
  const token = toEnumToken(raw)
  return POLICY_MASKING_ACTIONS.find((action) => action === token) ?? 'replace'
}

/** 将后端规则命中记录规范为 PolicyRuleHitListItem */
export function normalizePolicyRuleHitListItem(
  raw: Record<string, unknown>,
): PolicyRuleHitListItem {
  return {
    hitId: pickFirstNonEmptyString([raw.hitId, raw.hit_id, raw.id]),
    policyId: pickFirstNonEmptyString([raw.policyId, raw.policy_id]),
    occurredAt: pickFirstNonEmptyString([raw.occurredAt, raw.occurred_at, raw.createdAt]),
    ruleKeyword: pickFirstNonEmptyString([raw.ruleKeyword, raw.rule_keyword]),
    hitObject: pickFirstNonEmptyString([raw.hitObject, raw.hit_object]),
    maskingAction: normalizePolicyMaskingAction(raw.maskingAction ?? raw.masking_action),
    responsibleUser: pickFirstNonEmptyString([
      raw.responsibleUser,
      raw.responsible_user,
      raw.owner,
    ]),
    traceId: pickFirstNonEmptyString([raw.traceId, raw.trace_id]),
    hitScope: normalizePolicyRuleHitScope(raw.hitScope ?? raw.hit_scope),
  }
}

/** 规范规则命中追溯分页结果 */
export function normalizePolicyRuleHitPage(raw: unknown): PageResult<PolicyRuleHitListItem> {
  return normalizePageResult(raw, normalizePolicyRuleHitListItem)
}

/** 规范规则命中详情；缺 hitId 时返回 null，抽屉据此展示加载失败 */
export function normalizePolicyRuleHitDetail(raw: unknown): PolicyRuleHitDetail | null {
  const obj = toRecord(raw)
  if (!obj) return null

  const base = normalizePolicyRuleHitListItem(obj)
  if (!base.hitId) return null

  return {
    ...base,
    hitSnippet: pickFirstNonEmptyString([obj.hitSnippet, obj.hit_snippet, obj.snippet]),
    processingResult: pickFirstNonEmptyString([
      obj.processingResult,
      obj.processing_result,
      obj.result,
    ]),
  }
}

// ─── 版本与审批 ───────────────────────────────────────────────────────────────

/** 规范策略版本与审批页概览；缺 policyId 时返回 null */
export function normalizePolicyGovernanceOverview(
  raw: unknown,
): PolicyGovernanceOverview | null {
  const obj = toRecord(raw)
  if (!obj) return null

  const policyId = pickFirstNonEmptyString([obj.policyId, obj.policy_id, obj.id])
  if (!policyId) return null

  return {
    policyId,
    policyName: pickFirstNonEmptyString([obj.policyName, obj.policy_name, obj.name]),
    currentVersion: pickFirstNonEmptyString(
      [obj.currentVersion, obj.current_version, obj.versionNo],
      '—',
    ),
    pendingCount: Number(obj.pendingCount ?? obj.pending_count ?? 0),
    lastChangedAt: pickFirstNonEmptyString([
      obj.lastChangedAt,
      obj.last_changed_at,
      obj.updatedAt,
      obj.updated_at,
    ]),
  }
}

const POLICY_VERSION_STATUSES: PolicyVersionStatus[] = ['published', 'pending', 'history']

/** 规范版本状态；未知值降级为 history（只读，不会误开放审批/回滚入口） */
function normalizePolicyVersionStatus(raw: unknown): PolicyVersionStatus {
  const token = toEnumToken(raw)
  return POLICY_VERSION_STATUSES.find((status) => status === token) ?? 'history'
}

/** 将后端策略版本记录规范为 PolicyVersionListItem */
export function normalizePolicyVersionListItem(
  raw: Record<string, unknown>,
): PolicyVersionListItem {
  return {
    versionId: pickFirstNonEmptyString([raw.versionId, raw.version_id, raw.id]),
    policyId: pickFirstNonEmptyString([raw.policyId, raw.policy_id]),
    versionNo: pickFirstNonEmptyString([raw.versionNo, raw.version_no, raw.version]),
    status: normalizePolicyVersionStatus(raw.status),
    creatorId: pickFirstNonEmptyString([raw.creatorId, raw.creator_id, raw.createdBy]),
    creatorName: pickFirstNonEmptyString([
      raw.creatorName,
      raw.creator_name,
      raw.creator,
      raw.createdByName,
    ]),
    createdAt: pickFirstNonEmptyString([raw.createdAt, raw.created_at]),
    changeSummary: pickFirstNonEmptyString([raw.changeSummary, raw.change_summary, raw.summary]),
  }
}

/** 规范策略版本分页结果 */
export function normalizePolicyVersionPage(raw: unknown): PageResult<PolicyVersionListItem> {
  return normalizePageResult(raw, normalizePolicyVersionListItem)
}

/** 规范差异对比一侧摘要 */
function normalizePolicyVersionDiffSide(raw: unknown): PolicyVersionDiffSide {
  const obj = toRecord(raw) ?? {}
  return {
    versionId: pickFirstNonEmptyString([obj.versionId, obj.version_id, obj.id]),
    versionNo: pickFirstNonEmptyString([obj.versionNo, obj.version_no, obj.version]),
    status: normalizePolicyVersionStatus(obj.status),
    configSummary: pickFirstNonEmptyString([obj.configSummary, obj.config_summary, obj.summary]),
  }
}

/** 规范版本差异对比结果；缺锚点或两侧摘要时返回 null，弹窗据此展示加载失败 */
export function normalizePolicyVersionDiffResult(raw: unknown): PolicyVersionDiffResult | null {
  const obj = toRecord(raw)
  if (!obj) return null

  const left = normalizePolicyVersionDiffSide(obj.left)
  const right = normalizePolicyVersionDiffSide(obj.right)
  if (!left.versionId && !right.versionId) return null

  const anchorVersionId = pickFirstNonEmptyString(
    [obj.anchorVersionId, obj.anchor_version_id],
    right.versionId,
  )

  return {
    policyId: pickFirstNonEmptyString([obj.policyId, obj.policy_id]),
    policyName: pickFirstNonEmptyString([obj.policyName, obj.policy_name]),
    anchorVersionId,
    leftVersionId: pickFirstNonEmptyString(
      [obj.leftVersionId, obj.left_version_id],
      left.versionId,
    ),
    rightVersionId: pickFirstNonEmptyString(
      [obj.rightVersionId, obj.right_version_id],
      right.versionId,
    ),
    left,
    right,
  }
}

/**
 * 规范下载结果（downloadUrl + fileName），无下载链接时返回 null
 * @param raw - 后端 DownloadResult
 * @param fallbackFileName - 后端缺 fileName 时的建议保存名
 */
function normalizeDownloadResult(
  raw: unknown,
  fallbackFileName: string,
): { downloadUrl: string; fileName: string } | null {
  const obj = toRecord(raw)
  if (!obj) return null

  const downloadUrl = pickFirstNonEmptyString([obj.downloadUrl, obj.download_url, obj.url])
  if (!downloadUrl) return null

  return {
    downloadUrl,
    fileName: pickFirstNonEmptyString(
      [obj.fileName, obj.file_name, obj.filename, obj.name],
      fallbackFileName,
    ),
  }
}

/** 规范版本差异报告导出结果；无下载链接时返回 null */
export function normalizePolicyVersionDiffExport(
  raw: unknown,
): PolicyVersionDiffExportResult | null {
  return normalizeDownloadResult(raw, 'policy-version-diff.pdf')
}

/**
 * 版本导出请求体（policyId / versionId 走 path，不重复放 body）
 * @param params - 导出范围与格式
 */
export function exportPolicyVersionParamsToApi(
  params: ExportPolicyVersionParams,
): Record<string, unknown> {
  return {
    scope: params.scope,
    format: params.format,
  }
}

/**
 * 规范版本导出结果；导出失败时给空 downloadUrl，由弹窗提示重试
 * @param raw - 后端 DownloadResult
 * @param params - 本次导出参数，用于拼默认文件名
 */
export function normalizePolicyVersionExport(
  raw: unknown,
  params: ExportPolicyVersionParams,
): PolicyVersionExportResult {
  const fallbackFileName = `policy-${params.policyId}-${params.versionId}.${params.format}`
  return (
    normalizeDownloadResult(raw, fallbackFileName) ?? {
      downloadUrl: '',
      fileName: fallbackFileName,
    }
  )
}

/**
 * 版本审批请求体（policyId / versionId 走 path，不重复放 body）
 * @param params - 审批结论、意见与生效时间
 */
export function submitPolicyVersionApprovalParamsToApi(
  params: SubmitPolicyVersionApprovalParams,
): Record<string, unknown> {
  return {
    conclusion: params.conclusion,
    opinion: params.opinion,
    effectiveTime: params.effectiveTime,
  }
}

/**
 * 规范审批响应；后端回空 body 时用请求参数兜底，保证抽屉能给出正确提示文案
 * @param raw - 后端 data
 * @param params - 本次审批参数
 */
export function normalizeSubmitPolicyVersionApprovalResult(
  raw: unknown,
  params: SubmitPolicyVersionApprovalParams,
): SubmitPolicyVersionApprovalResult {
  const obj = toRecord(raw) ?? {}

  const conclusionToken = toEnumToken(obj.conclusion)
  const conclusion: PolicyVersionApprovalConclusion =
    conclusionToken === 'approved' || conclusionToken === 'rejected'
      ? conclusionToken
      : params.conclusion

  const effectiveToken = toEnumToken(obj.effectiveTime ?? obj.effective_time)
  const effectiveTime: PolicyVersionEffectiveTime =
    effectiveToken === 'immediate' || effectiveToken === 'next-window'
      ? effectiveToken
      : params.effectiveTime

  return {
    versionId: pickFirstNonEmptyString([obj.versionId, obj.version_id], params.versionId),
    conclusion,
    effectiveTime,
  }
}

/**
 * 版本回滚请求体（policyId / versionId 走 path，仅提交确认版本号）
 * @param params - 用户输入的确认版本号
 */
export function rollbackPolicyVersionParamsToApi(
  params: RollbackPolicyVersionParams,
): Record<string, unknown> {
  return {
    confirmVersionNo: params.confirmVersionNo,
  }
}
