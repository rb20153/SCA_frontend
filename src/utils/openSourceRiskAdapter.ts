import type { PageResult, RiskSourceMode } from '@/types/common'
import type {
  ExportOpenSourceRiskSbomResult,
  OpenSourceRiskComponent,
  OpenSourceRiskComponentDetail,
  OpenSourceRiskComponentIdentifyBasis,
  OpenSourceRiskComponentIgnoreReason,
  OpenSourceRiskComponentQueryParams,
  OpenSourceRiskComponentRiskLevel,
  OpenSourceRiskDetailSummary,
  OpenSourceRiskSbomGranularity,
  OpenSourceRiskSbomModulePreviewRow,
  OpenSourceRiskSbomPackagePreviewRow,
  OpenSourceRiskSbomPreviewQueryParams,
  OpenSourceRiskSbomProjectPreviewRow,
  OpenSourceRiskVulnerability,
  OpenSourceRiskVulnerabilityDetail,
  OpenSourceRiskVulnerabilityDispositionMethod,
  OpenSourceRiskVulnerabilityProcessingStatus,
  OpenSourceRiskVulnerabilityQueryParams,
  OpenSourceRiskVulnerabilityRegistration,
  OpenSourceRiskVulnerabilityTimelineItem,
  OpenSourceRiskVulnerabilityVerificationResult,
  RiskComponentGraph,
  RiskComponentGraphEdge,
  RiskComponentGraphNode,
  RiskComponentGraphRiskLevel,
} from '@/types/detect'
import { normalizeList, normalizePageResult } from '@/utils/pageResultAdapter'

/** 识别依据 → 展示文案（后端只回枚举、不回 label 时兜底） */
const IDENTIFY_BASIS_LABEL: Record<OpenSourceRiskComponentIdentifyBasis, string> = {
  cmake: 'CMake 依赖声明',
  symbol: '符号特征匹配',
  manifest: '依赖清单声明',
  sbom: '导入 SBOM 条目',
}

/** 组件忽略原因白名单 */
const IGNORE_REASONS: OpenSourceRiskComponentIgnoreReason[] = [
  'misidentification',
  'internal',
  'covered',
  'other',
]

/** 漏洞处置方式白名单 */
const DISPOSITION_METHODS: OpenSourceRiskVulnerabilityDispositionMethod[] = [
  'upgrade-version',
  'temp-isolate',
  'accept-risk',
  'false-positive-ignore',
]

/** 取第一个非空字符串；后端存在把字段返回成 `""` 而非省略的情况，`??` 挡不住 */
function pickFirstNonEmptyString(...candidates: unknown[]): string {
  for (const candidate of candidates) {
    const text = String(candidate ?? '').trim()
    if (text) {
      return text
    }
  }
  return ''
}

/** 安全转数字，NaN 与空值都回落到 0 */
function toNumber(raw: unknown, fallback = 0): number {
  if (raw === null || raw === undefined || raw === '') {
    return fallback
  }
  const value = Number(raw)
  return Number.isNaN(value) ? fallback : value
}

/** 转布尔（兼容后端回 1 / "true" / "Y" 的写法） */
function toBoolean(raw: unknown): boolean {
  if (typeof raw === 'boolean') {
    return raw
  }
  const text = String(raw ?? '').trim().toLowerCase()
  return text === 'true' || text === '1' || text === 'y' || text === 'yes'
}

/** 把 unknown 收窄为对象，非对象一律给空对象，避免取字段抛异常 */
function toRecord(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : {}
}

/**
 * 规范开源风险等级
 * openapi 枚举含 critical / info，但前端组件清单与漏洞清单只有 high/medium/low，
 * 因此 critical 归到 high、info 归到 low，识别不出时按 low 处理（不虚报风险）
 */
export function normalizeOpenSourceRiskLevel(raw: unknown): OpenSourceRiskComponentRiskLevel {
  const text = String(raw ?? '').trim().toLowerCase()
  if (text === 'critical' || text === 'high' || text === 'severe') {
    return 'high'
  }
  if (text === 'medium' || text === 'moderate' || text === 'mid') {
    return 'medium'
  }
  return 'low'
}

/** 规范开源风险任务来源（项目扫描 / 导入 SBOM） */
function normalizeRiskSourceMode(raw: unknown): RiskSourceMode {
  const text = String(raw ?? '').trim().toLowerCase()
  if (text === 'import-sbom' || text === 'import_sbom' || text === 'sbom') {
    return 'import-sbom'
  }
  return 'project-scan'
}

/**
 * 规范组件识别依据
 * 后端组件清单接口只返回 identifyBasisLabel，缺 identifyBasis 时按 label 文案与来源反推，
 * 否则 `RISK_COMPONENT_IDENTIFY_BASIS_COLOR[identifyBasis]` 会取到 undefined
 */
function normalizeIdentifyBasis(
  raw: unknown,
  label: string,
  sourceMode: RiskSourceMode,
): OpenSourceRiskComponentIdentifyBasis {
  const text = String(raw ?? '').trim().toLowerCase()
  if (text === 'cmake' || text === 'symbol' || text === 'manifest' || text === 'sbom') {
    return text
  }

  const hint = `${text} ${label}`.toLowerCase()
  if (hint.includes('cmake')) return 'cmake'
  if (hint.includes('symbol') || hint.includes('符号')) return 'symbol'
  if (hint.includes('sbom')) return 'sbom'
  if (hint.includes('manifest') || hint.includes('清单') || hint.includes('声明')) {
    return 'manifest'
  }
  return sourceMode === 'import-sbom' ? 'sbom' : 'manifest'
}

/** 规范组件忽略原因；未忽略或取值非法时为 null */
function normalizeIgnoreReason(
  raw: unknown,
  ignored: boolean,
): OpenSourceRiskComponentIgnoreReason | null {
  if (!ignored) {
    return null
  }
  const text = String(raw ?? '').trim().toLowerCase()
  const matched = IGNORE_REASONS.find((reason) => reason === text)
  return matched ?? 'other'
}

/** 规范漏洞处理状态（兼容 needs-review / need_review 等写法） */
function normalizeProcessingStatus(raw: unknown): OpenSourceRiskVulnerabilityProcessingStatus {
  const text = String(raw ?? '').trim().toLowerCase().replace(/-/g, '_')
  if (text === 'verified' || text === 'done' || text === 'completed' || text === 'closed') {
    return 'verified'
  }
  if (text === 'needs_review' || text === 'need_review' || text === 'reviewing' || text === 'in_review') {
    return 'needs_review'
  }
  return 'pending'
}

/** 规范漏洞处置方式；识别不出时按「接受风险」兜底，避免 label 取值为 undefined */
function normalizeDispositionMethod(raw: unknown): OpenSourceRiskVulnerabilityDispositionMethod {
  const text = String(raw ?? '').trim().toLowerCase().replace(/_/g, '-')
  const matched = DISPOSITION_METHODS.find((method) => method === text)
  return matched ?? 'accept-risk'
}

/** 规范依赖图节点风险等级（根节点无风险，用 none） */
function normalizeGraphRiskLevel(raw: unknown, isRoot: boolean): RiskComponentGraphRiskLevel {
  if (isRoot) {
    return 'none'
  }
  const text = String(raw ?? '').trim().toLowerCase()
  if (text === 'none' || text === 'no-risk' || text === 'safe') {
    return 'none'
  }
  return normalizeOpenSourceRiskLevel(raw)
}

/** 剔除空串 / undefined / null 后的 query，避免筛选条件被空值覆盖 */
function toQuery(params: Record<string, unknown>): Record<string, unknown> {
  const query: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') {
      continue
    }
    query[key] = value
  }
  return query
}

/**
 * 解包分页 payload
 * 后端存在把分页体再套一层 `data` 的实现，这里递归到出现 list/items/records 的那一层
 */
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

/** total 小于本页条数时按本页条数兜底（后端 total 偶发回 0） */
function fixPageTotal<T>(page: PageResult<T>): PageResult<T> {
  if (page.list.length > 0 && page.total < page.list.length) {
    return { ...page, total: page.list.length }
  }
  return page
}

/**
 * 规范开源风险详情 · 顶部统计摘要
 * @param raw - 后端 summary 对象
 */
export function normalizeOpenSourceRiskDetailSummary(raw: unknown): OpenSourceRiskDetailSummary {
  const obj = toRecord(raw)
  return {
    identifiedComponentCount: toNumber(
      obj.identifiedComponentCount ?? obj.identified_component_count ?? obj.componentCount,
    ),
    highRiskVulnCount: toNumber(
      obj.highRiskVulnCount ?? obj.high_risk_vuln_count ?? obj.highRiskVulnerabilityCount,
    ),
    pendingCount: toNumber(obj.pendingCount ?? obj.pending_count ?? obj.pendingVulnCount),
    licenseRiskCount: toNumber(obj.licenseRiskCount ?? obj.license_risk_count),
  }
}

/**
 * 组件清单查询参数 → 后端 query（空值不下发）
 * @param params - 分页与筛选（componentName / sourceMode / riskLevel / includeIgnored）
 */
export function openSourceRiskComponentQueryParamsToApi(
  params: OpenSourceRiskComponentQueryParams,
): Record<string, unknown> {
  return toQuery({ ...params })
}

/** 规范组件清单单行（兼容 snake_case，缺 identifyBasis 时按 label 反推） */
export function normalizeOpenSourceRiskComponent(
  raw: Record<string, unknown>,
): OpenSourceRiskComponent {
  const sourceMode = normalizeRiskSourceMode(raw.sourceMode ?? raw.source_mode ?? raw.source)
  const identifyBasisLabelRaw = pickFirstNonEmptyString(
    raw.identifyBasisLabel,
    raw.identify_basis_label,
  )
  const identifyBasis = normalizeIdentifyBasis(
    raw.identifyBasis ?? raw.identify_basis,
    identifyBasisLabelRaw,
    sourceMode,
  )
  const ignored = toBoolean(raw.ignored ?? raw.isIgnored ?? raw.is_ignored)

  return {
    componentId: pickFirstNonEmptyString(raw.componentId, raw.component_id, raw.id),
    componentName: pickFirstNonEmptyString(raw.componentName, raw.component_name, raw.name),
    version: pickFirstNonEmptyString(raw.version, raw.componentVersion, raw.component_version, '—'),
    license: pickFirstNonEmptyString(raw.license, raw.licenseId, raw.license_id, '—'),
    identifyBasis,
    identifyBasisLabel: identifyBasisLabelRaw || IDENTIFY_BASIS_LABEL[identifyBasis],
    sourceMode,
    riskLevel: normalizeOpenSourceRiskLevel(raw.riskLevel ?? raw.risk_level),
    ignored,
    ignoreReason: normalizeIgnoreReason(raw.ignoreReason ?? raw.ignore_reason, ignored),
  }
}

/**
 * 规范组件清单分页结果
 * @param raw - 后端分页对象（兼容 list / items / records）
 */
export function normalizeOpenSourceRiskComponentPage(
  raw: unknown,
): PageResult<OpenSourceRiskComponent> {
  return fixPageTotal(
    normalizePageResult(unwrapPageRaw(raw), normalizeOpenSourceRiskComponent),
  )
}

/**
 * 规范组件详情（抽屉）
 * @param raw - 后端 detail 对象
 * @param componentId - 路由/列表携带的组件 ID，响应缺字段时兜底
 */
export function normalizeOpenSourceRiskComponentDetail(
  raw: unknown,
  componentId: string,
): OpenSourceRiskComponentDetail {
  const obj = toRecord(raw)
  const base = normalizeOpenSourceRiskComponent(obj)

  return {
    ...base,
    componentId: base.componentId || componentId,
    identifyBasisDetail: pickFirstNonEmptyString(
      obj.identifyBasisDetail,
      obj.identify_basis_detail,
      obj.identifyBasisDescription,
      base.identifyBasisLabel,
      '—',
    ),
    relatedVulnerabilityCount: toNumber(
      obj.relatedVulnerabilityCount ??
        obj.related_vulnerability_count ??
        obj.vulnerabilityCount ??
        obj.vulnerability_count,
    ),
  }
}

/** 规范依赖图单节点（isRoot 由 depth===0 兜底推断） */
function normalizeRiskComponentGraphNode(raw: Record<string, unknown>): RiskComponentGraphNode {
  const depth = toNumber(raw.depth ?? raw.level)
  const isRoot =
    raw.isRoot !== undefined || raw.is_root !== undefined
      ? toBoolean(raw.isRoot ?? raw.is_root)
      : depth === 0

  return {
    id: pickFirstNonEmptyString(raw.id, raw.nodeId, raw.node_id, raw.componentId, raw.component_id),
    componentName: pickFirstNonEmptyString(
      raw.componentName,
      raw.component_name,
      raw.name,
      raw.label,
    ),
    version: pickFirstNonEmptyString(raw.version, raw.componentVersion, raw.component_version),
    isRoot,
    riskLevel: normalizeGraphRiskLevel(raw.riskLevel ?? raw.risk_level, isRoot),
    vulnerabilityCount: toNumber(
      raw.vulnerabilityCount ?? raw.vulnerability_count ?? raw.vulnCount ?? raw.vuln_count,
    ),
    depth,
  }
}

/** 规范依赖图单边（source 依赖 target） */
function normalizeRiskComponentGraphEdge(raw: Record<string, unknown>): RiskComponentGraphEdge {
  return {
    source: pickFirstNonEmptyString(raw.source, raw.from, raw.parent, raw.parentId),
    target: pickFirstNonEmptyString(raw.target, raw.to, raw.child, raw.childId),
  }
}

/**
 * 规范组件依赖关系图（G6 渲染用）
 * 节点 id 缺失、边端点缺失的脏数据会被剔除，避免 G6 渲染时报错
 * @param raw - 后端 graph 对象
 */
export function normalizeRiskComponentGraph(raw: unknown): RiskComponentGraph {
  const obj = toRecord(raw)
  const nodes = normalizeList(obj.nodes ?? obj.vertices, normalizeRiskComponentGraphNode).filter(
    (node) => node.id !== '',
  )
  const nodeIds = new Set(nodes.map((node) => node.id))
  const edges = normalizeList(obj.edges ?? obj.links, normalizeRiskComponentGraphEdge).filter(
    (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target),
  )

  return { nodes, edges }
}

/**
 * 漏洞清单查询参数 → 后端 query（空值不下发）
 * @param params - 分页与筛选（cveId / componentName / riskLevel / processingStatus）
 */
export function openSourceRiskVulnerabilityQueryParamsToApi(
  params: OpenSourceRiskVulnerabilityQueryParams,
): Record<string, unknown> {
  return toQuery({ ...params })
}

/** 规范漏洞清单单行 */
export function normalizeOpenSourceRiskVulnerability(
  raw: Record<string, unknown>,
): OpenSourceRiskVulnerability {
  return {
    vulnerabilityId: pickFirstNonEmptyString(
      raw.vulnerabilityId,
      raw.vulnerability_id,
      raw.id,
      raw.vulnId,
    ),
    cveId: pickFirstNonEmptyString(raw.cveId, raw.cve_id, raw.cve, '—'),
    componentName: pickFirstNonEmptyString(raw.componentName, raw.component_name, raw.component),
    version: pickFirstNonEmptyString(raw.version, raw.componentVersion, raw.component_version, '—'),
    riskLevel: normalizeOpenSourceRiskLevel(raw.riskLevel ?? raw.risk_level ?? raw.severity),
    cvssScore: toNumber(raw.cvssScore ?? raw.cvss_score ?? raw.cvss),
    processingStatus: normalizeProcessingStatus(
      raw.processingStatus ?? raw.processing_status ?? raw.status,
    ),
    sourceMode: normalizeRiskSourceMode(raw.sourceMode ?? raw.source_mode ?? raw.source),
  }
}

/**
 * 规范漏洞清单分页结果
 * @param raw - 后端分页对象
 */
export function normalizeOpenSourceRiskVulnerabilityPage(
  raw: unknown,
): PageResult<OpenSourceRiskVulnerability> {
  return fixPageTotal(
    normalizePageResult(unwrapPageRaw(raw), normalizeOpenSourceRiskVulnerability),
  )
}

/** 规范处置登记信息；对象为空时返回 null（页面据此切换展示分支） */
function normalizeVulnerabilityRegistration(
  raw: unknown,
): OpenSourceRiskVulnerabilityRegistration | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null
  }
  const obj = raw as Record<string, unknown>
  if (Object.keys(obj).length === 0) {
    return null
  }

  return {
    method: normalizeDispositionMethod(obj.method ?? obj.dispositionMethod ?? obj.disposition_method),
    assigneeName: pickFirstNonEmptyString(obj.assigneeName, obj.assignee_name, obj.assignee, '—'),
    plannedCompleteDate: pickFirstNonEmptyString(
      obj.plannedCompleteDate,
      obj.planned_complete_date,
      obj.plannedDate,
      '—',
    ),
    description: pickFirstNonEmptyString(obj.description, obj.plan, obj.remark, '—'),
    registeredBy: pickFirstNonEmptyString(
      obj.registeredBy,
      obj.registered_by,
      obj.operatorName,
      obj.assigneeName,
      '—',
    ),
    registeredAt: pickFirstNonEmptyString(
      obj.registeredAt,
      obj.registered_at,
      obj.createdAt,
      obj.created_at,
      '—',
    ),
  }
}

/** 规范处置验证结果（已验证态）；对象为空时返回 null */
function normalizeVulnerabilityVerificationResult(
  raw: unknown,
): OpenSourceRiskVulnerabilityVerificationResult | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null
  }
  const obj = raw as Record<string, unknown>
  if (Object.keys(obj).length === 0) {
    return null
  }

  return {
    finalMethod: normalizeDispositionMethod(obj.finalMethod ?? obj.final_method ?? obj.method),
    verifierName: pickFirstNonEmptyString(obj.verifierName, obj.verifier_name, obj.verifier, '—'),
    verifiedAt: pickFirstNonEmptyString(obj.verifiedAt, obj.verified_at, obj.reviewedAt, '—'),
    resultDescription: pickFirstNonEmptyString(
      obj.resultDescription,
      obj.result_description,
      obj.opinion,
      obj.conclusionDescription,
      '—',
    ),
  }
}

/** 规范处置时间线条目 */
function normalizeVulnerabilityTimelineItem(
  raw: Record<string, unknown>,
): OpenSourceRiskVulnerabilityTimelineItem {
  return {
    time: pickFirstNonEmptyString(raw.time, raw.at, raw.createdAt, raw.created_at, raw.timestamp),
    message: pickFirstNonEmptyString(raw.message, raw.content, raw.description, raw.action, '—'),
  }
}

/** 规范受影响组件列表（兼容元素为字符串或 { componentName, version } 对象） */
function normalizeAffectedComponents(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    return []
  }
  return raw
    .map((item) => {
      if (item && typeof item === 'object') {
        const obj = item as Record<string, unknown>
        const name = pickFirstNonEmptyString(obj.componentName, obj.component_name, obj.name)
        const version = pickFirstNonEmptyString(obj.version, obj.componentVersion)
        return version ? `${name}@${version}` : name
      }
      return String(item ?? '').trim()
    })
    .filter(Boolean)
}

/**
 * 规范漏洞详情（抽屉 / 复核弹窗）
 * 后端在「需复核」态可能只回 registration 而不回 pendingReviewPlan，这里按状态互相补齐，
 * 否则复核弹窗拿不到待审方案
 * @param raw - 后端 detail 对象
 * @param vulnerabilityId - 列表携带的漏洞 ID，响应缺字段时兜底
 */
export function normalizeOpenSourceRiskVulnerabilityDetail(
  raw: unknown,
  vulnerabilityId: string,
): OpenSourceRiskVulnerabilityDetail {
  const obj = toRecord(raw)
  const base = normalizeOpenSourceRiskVulnerability(obj)
  const registration = normalizeVulnerabilityRegistration(obj.registration)
  const pendingReviewPlan = normalizeVulnerabilityRegistration(
    obj.pendingReviewPlan ?? obj.pending_review_plan,
  )

  return {
    vulnerabilityId: base.vulnerabilityId || vulnerabilityId,
    cveId: base.cveId,
    componentName: base.componentName,
    version: base.version,
    riskLevel: base.riskLevel,
    cvssScore: base.cvssScore,
    processingStatus: base.processingStatus,
    affectedComponents: normalizeAffectedComponents(
      obj.affectedComponents ?? obj.affected_components,
    ),
    fixSuggestion: pickFirstNonEmptyString(obj.fixSuggestion, obj.fix_suggestion, obj.suggestion, '—'),
    registration,
    pendingReviewPlan:
      pendingReviewPlan ?? (base.processingStatus === 'needs_review' ? registration : null),
    verificationResult: normalizeVulnerabilityVerificationResult(
      obj.verificationResult ?? obj.verification_result,
    ),
    dispositionTimeline: normalizeList(
      obj.dispositionTimeline ?? obj.disposition_timeline ?? obj.timeline,
      normalizeVulnerabilityTimelineItem,
    ),
  }
}

/**
 * SBOM 预览查询参数 → 后端 query（granularity 必填，空值不下发）
 * @param params - 输出粒度与分页
 */
export function openSourceRiskSbomPreviewQueryParamsToApi(
  params: OpenSourceRiskSbomPreviewQueryParams,
): Record<string, unknown> {
  return toQuery({ ...params })
}

/** 规范 SBOM 项目级预览行 */
function normalizeSbomProjectPreviewRow(
  raw: Record<string, unknown>,
  index: number,
): OpenSourceRiskSbomProjectPreviewRow {
  return {
    rowId: pickFirstNonEmptyString(
      raw.rowId,
      raw.row_id,
      raw.id,
      raw.componentId,
      raw.component_id,
      `sbom-project-${index}`,
    ),
    componentName: pickFirstNonEmptyString(raw.componentName, raw.component_name, raw.name, '—'),
    version: pickFirstNonEmptyString(raw.version, raw.componentVersion, '—'),
    license: pickFirstNonEmptyString(raw.license, raw.licenseId, raw.license_id, '—'),
    supplier: pickFirstNonEmptyString(raw.supplier, raw.vendor, raw.publisher, '—'),
    referenceMode: pickFirstNonEmptyString(
      raw.referenceMode,
      raw.reference_mode,
      raw.referenceType,
      '—',
    ),
    riskLevel: normalizeOpenSourceRiskLevel(raw.riskLevel ?? raw.risk_level),
  }
}

/** 规范 SBOM 模块级预览行 */
function normalizeSbomModulePreviewRow(
  raw: Record<string, unknown>,
  index: number,
): OpenSourceRiskSbomModulePreviewRow {
  return {
    rowId: pickFirstNonEmptyString(
      raw.rowId,
      raw.row_id,
      raw.id,
      raw.moduleId,
      raw.module_id,
      `sbom-module-${index}`,
    ),
    moduleName: pickFirstNonEmptyString(raw.moduleName, raw.module_name, raw.name, '—'),
    componentCount: toNumber(raw.componentCount ?? raw.component_count),
    highRiskLicense: pickFirstNonEmptyString(
      raw.highRiskLicense,
      raw.high_risk_license,
      raw.riskLicense,
      '—',
    ),
    vulnerableComponentCount: toNumber(
      raw.vulnerableComponentCount ?? raw.vulnerable_component_count,
    ),
  }
}

/** 规范 SBOM 包级预览行（confidence 兼容后端回百分比） */
function normalizeSbomPackagePreviewRow(
  raw: Record<string, unknown>,
  index: number,
): OpenSourceRiskSbomPackagePreviewRow {
  const confidenceRaw = toNumber(raw.confidence ?? raw.score)
  const conflictHintRaw = String(raw.conflictHint ?? raw.conflict_hint ?? '').trim().toLowerCase()
  const hasConflict =
    conflictHintRaw === 'conflict' ||
    conflictHintRaw === 'true' ||
    toBoolean(raw.hasConflict ?? raw.has_conflict)

  return {
    rowId: pickFirstNonEmptyString(
      raw.rowId,
      raw.row_id,
      raw.id,
      raw.packageId,
      raw.package_id,
      `sbom-package-${index}`,
    ),
    packageLabel: pickFirstNonEmptyString(
      raw.packageLabel,
      raw.package_label,
      raw.packageName,
      raw.package_name,
      raw.name,
      '—',
    ),
    evidenceSource: pickFirstNonEmptyString(
      raw.evidenceSource,
      raw.evidence_source,
      raw.evidence,
      '—',
    ),
    // 页面按 0–1 两位小数展示，后端回 0–100 时折算回 0–1
    confidence: confidenceRaw > 1 ? confidenceRaw / 100 : confidenceRaw,
    conflictHint: hasConflict ? 'conflict' : 'none',
    remediationSuggestion: pickFirstNonEmptyString(
      raw.remediationSuggestion,
      raw.remediation_suggestion,
      raw.suggestion,
      '—',
    ),
  }
}

/**
 * 规范 SBOM 预览分页结果（按输出粒度选择行映射）
 * @param raw - 后端分页对象
 * @param granularity - 当前输出粒度，决定行字段结构
 */
export function normalizeOpenSourceRiskSbomPreviewPage(
  raw: unknown,
  granularity: OpenSourceRiskSbomGranularity,
): PageResult<
  | OpenSourceRiskSbomProjectPreviewRow
  | OpenSourceRiskSbomModulePreviewRow
  | OpenSourceRiskSbomPackagePreviewRow
> {
  let index = 0
  const page = normalizePageResult(unwrapPageRaw(raw), (item) => {
    const rowIndex = index
    index += 1
    if (granularity === 'module') {
      return normalizeSbomModulePreviewRow(item, rowIndex)
    }
    if (granularity === 'package') {
      return normalizeSbomPackagePreviewRow(item, rowIndex)
    }
    return normalizeSbomProjectPreviewRow(item, rowIndex)
  })
  return fixPageTotal(page)
}

/**
 * 规范 SBOM 导出结果（下载链接 + 建议文件名）
 * @param raw - 后端 DownloadResult 对象
 */
export function normalizeExportOpenSourceRiskSbomResult(
  raw: unknown,
): ExportOpenSourceRiskSbomResult {
  const obj = toRecord(raw)
  return {
    downloadUrl: pickFirstNonEmptyString(obj.downloadUrl, obj.download_url, obj.url),
    fileName: pickFirstNonEmptyString(obj.fileName, obj.file_name, obj.name, 'sbom'),
  }
}
