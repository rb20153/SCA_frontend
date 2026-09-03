import type {
  AiParseFallbackCompareItem,
  AiParseResultDetail,
  AiParseEvidenceCollection,
  AiParseLicenseSource,
  AiParseScanDepth,
  AiParseTask,
  AiParseTaskQueryParams,
  AiParseTaskStatus,
  SubmitAiParseFallbackParams,
} from '@/types/detect'
import type { FileTreeLicenseTagColor, FileTreeNode, FileTreeNodeType } from '@/types/fileTree'
import type { SourceIngestMode } from '@/types/sourceIngest'
import { normalizeTaskStatus } from '@/utils/detectAdapter'
import { normalizeList, normalizePageResult } from '@/utils/pageResultAdapter'

/** 取第一个非空字符串 */
function pickFirstNonEmptyString(...candidates: unknown[]): string {
  for (const candidate of candidates) {
    const text = String(candidate ?? '').trim()
    if (text) {
      return text
    }
  }
  return ''
}

/** 将 0–1 或 0–100 的比率规范为 0–100 */
function normalizePercentRate(raw: unknown): number {
  const value = Number(raw)
  if (Number.isNaN(value)) {
    return 0
  }
  if (value > 0 && value <= 1) {
    return Math.round(value * 1000) / 10
  }
  return value
}

/** 规范 AI 解析任务状态（复用检测任务 status 映射） */
function normalizeAiParseTaskStatus(raw: unknown): AiParseTaskStatus {
  const status = normalizeTaskStatus(raw)
  if (status === 'success') {
    return 'success'
  }
  if (status === 'failed') {
    return 'failed'
  }
  return 'running'
}

function normalizeAnalysisMode(raw: unknown): AiParseTask['analysisMode'] {
  const value = String(raw ?? '').toLowerCase()
  if (value === 'ai_provider') return 'ai_provider'
  if (value === 'rule_fallback') return 'rule_fallback'
  return 'pending'
}

/** 规范 AI 解析来源方式 */
function normalizeAiParseSourceMode(raw: unknown): SourceIngestMode {
  const text = String(raw ?? '').toLowerCase()
  if (
    text === 'upload-source-package' ||
    text.includes('upload') ||
    text.includes('package') ||
    text.includes('archive')
  ) {
    return 'upload-source-package'
  }
  return 'repo-pull'
}

/** 规范扫描深度（1–3 层依赖） */
function normalizeScanDepth(raw: unknown): AiParseScanDepth {
  const value = Number(raw)
  if (value === 1 || value === 2 || value === 3) {
    return value
  }
  return 3
}

/** 规范 License Tag 颜色 */
function normalizeLicenseTagColor(raw: unknown): FileTreeLicenseTagColor | undefined {
  const text = String(raw ?? '').toLowerCase()
  const allowed: FileTreeLicenseTagColor[] = [
    'success',
    'warning',
    'error',
    'default',
    'processing',
    'blue',
  ]
  if (allowed.includes(text as FileTreeLicenseTagColor)) {
    return text as FileTreeLicenseTagColor
  }
  if (text.includes('error') || text.includes('gpl') || text.includes('agpl')) {
    return 'error'
  }
  if (text.includes('warn')) {
    return 'warning'
  }
  if (text.includes('success') || text.includes('mit') || text.includes('bsd')) {
    return 'success'
  }
  return undefined
}

/** 规范 License 树节点类型 */
function normalizeLicenseTreeNodeType(raw: unknown): FileTreeNodeType {
  const text = String(raw ?? '').toLowerCase()
  if (text === 'file' || text === 'leaf') {
    return 'file'
  }
  return 'directory'
}

/** 规范 License 树单节点 */
function normalizeLicenseTreeNode(raw: Record<string, unknown>): FileTreeNode {
  const childrenRaw = raw.children ?? raw.nodes ?? raw.items
  const children = Array.isArray(childrenRaw)
    ? childrenRaw.map((child) => normalizeLicenseTreeNode(child as Record<string, unknown>))
    : undefined

  const label = String(raw.label ?? raw.name ?? raw.fileName ?? raw.file_name ?? '')
  const node: FileTreeNode = {
    nodeId: String(raw.nodeId ?? raw.id ?? raw.node_id ?? label),
    name: label,
    type: normalizeLicenseTreeNodeType(raw.type ?? raw.nodeType),
    path: raw.path ? String(raw.path) : raw.filePath ? String(raw.filePath) : undefined,
    licenseLabel: pickFirstNonEmptyString(
      raw.licenseLabel,
      raw.license_label,
      raw.license,
      raw.licenseId,
      raw.license_id,
    ),
    licenseTagColor: normalizeLicenseTagColor(
      raw.licenseTagColor ?? raw.license_tag_color ?? raw.tagColor ?? raw.tag_color,
    ),
  }

  if (children && children.length > 0) {
    node.children = children
  }

  return node
}

/** 解包 License 树 nodes（兼容单根对象 / 数组 / 嵌套 tree） */
function unwrapLicenseTreeNodes(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) {
    return raw as Record<string, unknown>[]
  }
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>
    const nodes = obj.nodes ?? obj.tree ?? obj.children ?? obj.items ?? obj.list
    if (Array.isArray(nodes)) {
      return nodes as Record<string, unknown>[]
    }
    if (nodes && typeof nodes === 'object') {
      return [nodes as Record<string, unknown>]
    }
  }
  return []
}

/** 解包 AI 解析任务分页 payload */
function unwrapAiParseTaskPageRaw(raw: unknown): unknown {
  if (Array.isArray(raw)) {
    return raw
  }
  if (!raw || typeof raw !== 'object') {
    return raw
  }
  const obj = raw as Record<string, unknown>
  if (obj.list ?? obj.items ?? obj.records) {
    return obj
  }
  if (obj.data !== undefined) {
    return unwrapAiParseTaskPageRaw(obj.data)
  }
  return obj
}

/** 规范 AI 解析历史列表项 */
export function normalizeAiParseTask(raw: Record<string, unknown>): AiParseTask {
  const resultSummaryRaw = raw.resultSummary ?? raw.result_summary ?? raw.summary
  const conflictCountRaw = raw.conflictCount ?? raw.conflict_count ?? raw.conflicts

  return {
    parseTaskId: pickFirstNonEmptyString(
      raw.parseTaskId,
      raw.parse_task_id,
      raw.id,
      raw.taskId,
      raw.task_id,
    ),
    parseObjectName: pickFirstNonEmptyString(
      raw.parseObjectName,
      raw.parse_object_name,
      raw.objectName,
      raw.object_name,
      raw.repositoryName,
      raw.repository_name,
      raw.packageName,
      raw.package_name,
    ),
    projectId: String(raw.projectId ?? raw.project_id ?? ''),
    projectName: pickFirstNonEmptyString(raw.projectName, raw.project_name, '—'),
    createdAt: String(raw.createdAt ?? raw.created_at ?? raw.submittedAt ?? raw.submitted_at ?? ''),
    sourceMode: normalizeAiParseSourceMode(raw.sourceMode ?? raw.source_mode ?? raw.dataSource),
    status: normalizeAiParseTaskStatus(raw.status),
    scanDepth: normalizeScanDepth(raw.scanDepth ?? raw.scan_depth ?? raw.depth),
    resultSummary:
      resultSummaryRaw === null || resultSummaryRaw === undefined || resultSummaryRaw === ''
        ? null
        : String(resultSummaryRaw),
    conflictCount:
      conflictCountRaw === null || conflictCountRaw === undefined || conflictCountRaw === ''
        ? null
        : Number(conflictCountRaw),
    analysisMode: normalizeAnalysisMode(raw.analysisMode ?? raw.analysis_mode),
    confidence: Number(raw.confidence ?? 0),
    elapsedMs: Number(raw.elapsedMs ?? raw.elapsed_ms ?? 0),
    fallbackUsed: Boolean(raw.fallbackUsed ?? raw.fallback_used),
  }
}

/** 规范 AI 解析历史分页结果 */
export function normalizeAiParseTaskPage(raw: unknown) {
  const page = normalizePageResult(unwrapAiParseTaskPageRaw(raw), normalizeAiParseTask)
  if (page.list.length > 0 && page.total < page.list.length) {
    return { ...page, total: page.list.length }
  }
  return page
}

/**
 * 规范 AI 解析结果详情
 * @param raw - 后端 result 对象
 * @param parseTaskId - 路由/列表携带的任务 ID（兜底）
 */
export function normalizeAiParseResultDetail(raw: unknown, parseTaskId: string): AiParseResultDetail {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const treeRaw =
    obj.licenseTreeNodes ?? obj.license_tree_nodes ?? obj.licenseTree ?? obj.tree ?? obj.nodes
  const ruleFallback =
    obj.ruleFallback && typeof obj.ruleFallback === 'object'
      ? (obj.ruleFallback as Record<string, unknown>)
      : obj.rule_fallback && typeof obj.rule_fallback === 'object'
        ? (obj.rule_fallback as Record<string, unknown>)
        : {}
  const licenseConflicts = normalizeLicenseConflicts([
    obj.licenseConflicts,
    obj.license_conflicts,
    obj.conflicts,
    obj.potentialConflicts,
    ruleFallback.conflicts,
    ruleFallback.licenseConflicts,
    ruleFallback.license_conflicts,
  ])
  const evidenceSummary = obj.evidenceSummary ?? obj.evidence_summary
  const collection = evidenceSummary && typeof evidenceSummary === 'object'
    ? (evidenceSummary as Record<string, unknown>).collection
    : null

  return {
    parseTaskId: pickFirstNonEmptyString(obj.parseTaskId, obj.parse_task_id, obj.id, parseTaskId),
    parseObjectName: pickFirstNonEmptyString(
      obj.parseObjectName,
      obj.parse_object_name,
      obj.objectName,
      obj.object_name,
    ),
    scanDepth: normalizeScanDepth(obj.scanDepth ?? obj.scan_depth ?? obj.depth),
    finishedAt: String(
      obj.finishedAt ?? obj.finished_at ?? obj.completedAt ?? obj.completed_at ?? '',
    ),
    aiParseCoverage: normalizePercentRate(
      obj.aiParseCoverage ?? obj.ai_parse_coverage ?? obj.coverage ?? obj.coverageRate,
    ),
    analysisMode: normalizeAnalysisMode(obj.analysisMode ?? obj.analysis_mode),
    aiStatus: String(obj.aiStatus ?? obj.ai_status ?? ''),
    confidence: Number(obj.confidence ?? 0),
    confidenceThreshold: Number(obj.confidenceThreshold ?? obj.confidence_threshold ?? 0),
    elapsedMs: Number(obj.elapsedMs ?? obj.elapsed_ms ?? 0),
    fallbackUsed: Boolean(obj.fallbackUsed ?? obj.fallback_used),
    fallbackReason: String(obj.fallbackReason ?? obj.fallback_reason ?? ''),
    licenseTreeNodes: unwrapLicenseTreeNodes(treeRaw).map((node) => normalizeLicenseTreeNode(node)),
    licenseConflicts,
    reportMarkdown: String(obj.reportMarkdown ?? obj.report_markdown ?? ''),
    licenseSources: normalizeList(obj.licenseSources ?? obj.license_sources, normalizeAiLicenseSource),
    provenanceVersion: normalizeNullableNumber(obj.provenanceVersion ?? obj.provenance_version),
    provenanceStatus: (() => {
      const value = String(obj.provenanceStatus ?? obj.provenance_status ?? '')
      return value === 'recorded' || value === 'legacy-unavailable' ? value : null
    })(),
    evidenceCollection: normalizeEvidenceCollection(collection),
    status: (() => {
      const value = String(obj.status ?? '').toLowerCase()
      return ['queued', 'running', 'completed', 'failed'].includes(value)
        ? value as AiParseResultDetail['status']
        : null
    })(),
  }
}

function normalizeStringList(raw: unknown): string[] {
  return Array.isArray(raw)
    ? raw.map((item) => String(item ?? '').trim()).filter(Boolean)
    : []
}

/** 将取证范围限制项转换为可读文本，兼容后端返回字符串或对象。 */
function normalizeEvidenceItem(item: unknown): string {
  if (typeof item === 'string' || typeof item === 'number') {
    return String(item).trim()
  }
  if (!item || typeof item !== 'object') {
    return ''
  }

  const obj = item as Record<string, unknown>
  const component = obj.component && typeof obj.component === 'object'
    ? obj.component as Record<string, unknown>
    : null
  const path = pickFirstNonEmptyString(
    obj.path,
    obj.filePath,
    obj.file_path,
    obj.sourceFile,
    obj.source_file,
    obj.manifestPath,
    obj.manifest_path,
  )
  const name = pickFirstNonEmptyString(
    obj.name,
    obj.packageName,
    obj.package_name,
    obj.dependency,
    obj.componentName,
    obj.component_name,
    component?.name,
  )
  const version = pickFirstNonEmptyString(
    obj.version,
    obj.packageVersion,
    obj.package_version,
    obj.componentVersion,
    obj.component_version,
    component?.version,
  )
  const identity = name ? `${name}${version ? `@${version}` : ''}` : ''
  const readable = [...new Set([path, identity].filter(Boolean))].join(' · ')
  if (readable) {
    return readable
  }

  try {
    return JSON.stringify(item)
  } catch {
    return ''
  }
}

function normalizeEvidenceItemList(raw: unknown): string[] {
  return Array.isArray(raw)
    ? raw.map(normalizeEvidenceItem).filter(Boolean)
    : []
}

function normalizeNullableNumber(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === '') return null
  const value = Number(raw)
  return Number.isNaN(value) ? null : value
}

function normalizeAiEvidence(raw: unknown): AiParseLicenseSource['evidence'] {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  return {
    startLine: normalizeNullableNumber(obj.startLine ?? obj.start_line),
    endLine: normalizeNullableNumber(obj.endLine ?? obj.end_line),
    contentSha256: String(obj.contentSha256 ?? obj.content_sha256 ?? ''),
    excerpt: String(obj.excerpt ?? ''),
    jsonPointer: obj.jsonPointer == null && obj.json_pointer == null
      ? null : String(obj.jsonPointer ?? obj.json_pointer),
    contentAvailable: Boolean(obj.contentAvailable ?? obj.content_available),
  }
}

function normalizeAiLicenseSource(raw: unknown): AiParseLicenseSource {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const repository = (obj.repository && typeof obj.repository === 'object' ? obj.repository : {}) as Record<string, unknown>
  const component = (obj.component && typeof obj.component === 'object' ? obj.component : {}) as Record<string, unknown>
  return {
    id: pickFirstNonEmptyString(obj.id), licenseId: pickFirstNonEmptyString(obj.licenseId, obj.license_id),
    filePath: pickFirstNonEmptyString(obj.filePath, obj.file_path), sourceType: pickFirstNonEmptyString(obj.sourceType, obj.source_type),
    acquisitionType: pickFirstNonEmptyString(obj.acquisitionType, obj.acquisition_type),
    repository: { name: pickFirstNonEmptyString(repository.name), url: repository.url == null ? null : String(repository.url), version: pickFirstNonEmptyString(repository.version) },
    component: { id: pickFirstNonEmptyString(component.id), name: pickFirstNonEmptyString(component.name), version: pickFirstNonEmptyString(component.version), purl: pickFirstNonEmptyString(component.purl) },
    dependencyDepth: normalizeNullableNumber(obj.dependencyDepth ?? obj.dependency_depth),
    dependencyScope: pickFirstNonEmptyString(obj.dependencyScope, obj.dependency_scope),
    dependencyPath: normalizeStringList(obj.dependencyPath ?? obj.dependency_path),
    packageRootPath: pickFirstNonEmptyString(obj.packageRootPath, obj.package_root_path),
    resolutionBasis: pickFirstNonEmptyString(obj.resolutionBasis, obj.resolution_basis),
    extractionMethod: pickFirstNonEmptyString(obj.extractionMethod, obj.extraction_method),
    evidence: normalizeAiEvidence(obj.evidence),
  }
}

function normalizeEvidenceCollection(raw: unknown): AiParseEvidenceCollection | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>
  return {
    dependenciesWithoutSourceFiles: normalizeEvidenceItemList(obj.dependenciesWithoutSourceFiles ?? obj.dependencies_without_source_files),
    excludedByDepth: normalizeEvidenceItemList(obj.excludedByDepth ?? obj.excluded_by_depth),
    unknownDependencyLevels: normalizeEvidenceItemList(obj.unknownDependencyLevels ?? obj.unknown_dependency_levels),
    unsupportedManifests: normalizeEvidenceItemList(obj.unsupportedManifests ?? obj.unsupported_manifests),
  }
}

/** 合并顶层与规则回退中的冲突，并提取对象中的可读说明。 */
function normalizeLicenseConflicts(candidates: unknown[]): string[] {
  const conflicts = candidates.flatMap((candidate) => (Array.isArray(candidate) ? candidate : []))
  return [...new Set(
    conflicts
      .map((item) => {
        if (typeof item === 'string') return item.trim()
        if (item && typeof item === 'object') {
          const conflict = item as Record<string, unknown>
          return String(conflict.message ?? conflict.description ?? conflict.detail ?? conflict.text ?? '').trim()
        }
        return String(item ?? '').trim()
      })
      .filter(Boolean),
  )]
}

/** 规范规则回退对比行 */
export function normalizeAiParseFallbackCompareItem(
  raw: Record<string, unknown>,
): AiParseFallbackCompareItem {
  return {
    targetPath: pickFirstNonEmptyString(
      raw.targetPath,
      raw.target_path,
      raw.path,
      raw.filePath,
      raw.file_path,
    ),
    aiResult: pickFirstNonEmptyString(raw.aiResult, raw.ai_result, raw.ai, '—'),
    ruleResult: pickFirstNonEmptyString(raw.ruleResult, raw.rule_result, raw.rule, '—'),
  }
}

/** 规范规则回退对比列表 */
export function normalizeAiParseFallbackCompareList(raw: unknown): AiParseFallbackCompareItem[] {
  return normalizeList(raw, normalizeAiParseFallbackCompareItem)
}

/**
 * AI 解析列表查询参数 → 后端 query（空值不下发）
 * @param params - 分页与筛选
 */
export function aiParseTaskQueryParamsToApi(
  params: AiParseTaskQueryParams,
): Record<string, unknown> {
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
 * 规则回退提交体 → 后端 body
 * @param data - 回退原因
 */
export function submitAiParseFallbackParamsToApi(
  data: SubmitAiParseFallbackParams,
): Record<string, unknown> {
  return { reason: data.reason }
}
