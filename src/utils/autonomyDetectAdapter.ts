import type { CodeDiffLine } from '@/types/common'
import type {
  AutonomyCodeAlertType,
  AutonomyCodeDiffPane,
  AutonomyCodeEvidenceItem,
  AutonomyDetectResultOverview,
  AutonomyLicenseArtifact,
  AutonomyLicenseEvidence,
  AutonomyLicenseResult,
  AutonomyLicenseSummary,
  AutonomyMatchedLicenseSource,
  AutonomyProjectDeclaredLicense,
  AutonomyFileDetail,
  AutonomyFileDetailSummary,
  AutonomyFingerprintAlertType,
  AutonomyFingerprintEvidenceItem,
  AutonomySourceHitItem,
  AutonomySourceHitQueryParams,
  AutonomySourceHitRiskLevel,
} from '@/types/detect'
import type { FileTreeData, FileTreeNode, FileTreeNodeType } from '@/types/fileTree'
import { normalizeTaskStatus } from '@/utils/detectAdapter'
import { normalizeList, normalizePageResult } from '@/utils/pageResultAdapter'

/** 将 0–1 或 0–100 的比率规范为页面展示用的 0–100 */
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

/**
 * 从多个候选数值中取第一个有效值，优先非 0
 * 后端 overview 常同时返回占位字段（0）与真实字段（overallAutonomyRate / performance.*）
 */
function pickNumberPreferNonZero(...candidates: unknown[]): number {
  let zeroFallback: number | undefined
  for (const candidate of candidates) {
    if (candidate === null || candidate === undefined || candidate === '') {
      continue
    }
    const value = Number(candidate)
    if (Number.isNaN(value)) {
      continue
    }
    if (value !== 0) {
      return value
    }
    if (zeroFallback === undefined) {
      zeroFallback = value
    }
  }
  return zeroFallback ?? 0
}

/** 将 pickNumberPreferNonZero 结果规范为 0–100 自主率 */
function pickAutonomyRate(...candidates: unknown[]): number {
  return normalizePercentRate(pickNumberPreferNonZero(...candidates))
}

function nullableNumber(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === '') return null
  const value = Number(raw)
  return Number.isNaN(value) ? null : value
}

function stringList(raw: unknown): string[] {
  return Array.isArray(raw) ? raw.map((item) => String(item ?? '').trim()).filter(Boolean) : []
}

function normalizeLicenseSummary(raw: unknown): AutonomyLicenseSummary | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>
  const status = String(obj.provenanceStatus ?? obj.provenance_status ?? '')
  return {
    projectLicenseIds: stringList(obj.projectLicenseIds ?? obj.project_license_ids),
    sourceLicenseIds: stringList(obj.sourceLicenseIds ?? obj.source_license_ids),
    projectDeclaredCount: nullableNumber(obj.projectDeclaredCount ?? obj.project_declared_count),
    matchedSourceCount: nullableNumber(obj.matchedSourceCount ?? obj.matched_source_count),
    unknownProjectSourceCount: nullableNumber(obj.unknownProjectSourceCount ?? obj.unknown_project_source_count),
    unknownMatchedSourceCount: nullableNumber(obj.unknownMatchedSourceCount ?? obj.unknown_matched_source_count),
    complete: Boolean(obj.complete),
    provenanceStatus: ['completed', 'partial', 'unavailable', 'disabled', 'legacy-unavailable', 'pending'].includes(status)
      ? status as AutonomyLicenseSummary['provenanceStatus'] : null,
  }
}

function normalizeLicenseEvidence(raw: unknown): AutonomyLicenseEvidence | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>
  return {
    startLine: nullableNumber(obj.startLine ?? obj.start_line), endLine: nullableNumber(obj.endLine ?? obj.end_line),
    contentSha256: String(obj.contentSha256 ?? obj.content_sha256 ?? ''), excerpt: String(obj.excerpt ?? ''),
    jsonPointer: obj.jsonPointer == null && obj.json_pointer == null ? null : String(obj.jsonPointer ?? obj.json_pointer),
    contentAvailable: Boolean(obj.contentAvailable ?? obj.content_available),
  }
}

function normalizeAutonomyLicenseResultItem(raw: unknown): AutonomyProjectDeclaredLicense {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const repository = (obj.repository && typeof obj.repository === 'object' ? obj.repository : {}) as Record<string, unknown>
  const component = (obj.component && typeof obj.component === 'object' ? obj.component : {}) as Record<string, unknown>
  return {
    id: String(obj.id ?? ''),
    artifactId: String(obj.artifactId ?? obj.artifact_id ?? ''), filePath: String(obj.filePath ?? obj.file_path ?? ''),
    licenseId: String(obj.licenseId ?? obj.license_id ?? ''),
    sourceType: String(obj.sourceType ?? obj.source_type ?? ''),
    repository: {
      name: String(repository.name ?? ''),
      version: String(repository.version ?? ''),
      url: repository.url == null ? null : String(repository.url),
    },
    component: {
      id: String(component.id ?? ''),
      name: String(component.name ?? ''),
      version: String(component.version ?? ''),
      purl: String(component.purl ?? ''),
    },
    evidence: normalizeLicenseEvidence(obj.evidence),
    dependencyDepth: nullableNumber(obj.dependencyDepth ?? obj.dependency_depth),
    dependencyScope: String(obj.dependencyScope ?? obj.dependency_scope ?? ''),
    relationship: String(obj.relationship ?? ''),
    extractionMethod: String(obj.extractionMethod ?? obj.extraction_method ?? ''),
  }
}

export function normalizeAutonomyLicenseResult(raw: unknown, taskId: string): AutonomyLicenseResult {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const summary = normalizeLicenseSummary(obj.summary) ?? {
    projectLicenseIds: [], sourceLicenseIds: [], projectDeclaredCount: null, matchedSourceCount: null,
    unknownProjectSourceCount: null, unknownMatchedSourceCount: null, complete: false, provenanceStatus: null,
  }
  const matchedSourcesRaw = obj.matchedSources ?? obj.matched_sources
  const matchedSources = Array.isArray(matchedSourcesRaw)
    ? (matchedSourcesRaw as unknown[]).map((rawItem: unknown) => {
      const item = (rawItem && typeof rawItem === 'object' ? rawItem : {}) as Record<string, unknown>
       const repository = (item.repository && typeof item.repository === 'object' ? item.repository : {}) as Record<string, unknown>
       const component = (item.component && typeof item.component === 'object' ? item.component : {}) as Record<string, unknown>
       const repositoryUrl = item.repositoryUrl ?? item.repository_url ?? repository.url
       return {
         repoId: String(item.repoId ?? item.repo_id ?? ''),
         sourceFile: String(item.sourceFile ?? item.source_file ?? ''),
         licenseId: String(item.licenseId ?? item.license_id ?? ''),
         reviewStatus: String(item.reviewStatus ?? item.review_status ?? ''),
         repositoryName: String(item.repositoryName ?? item.repository_name ?? repository.name ?? ''),
         repositoryVersion: String(item.repositoryVersion ?? item.repository_version ?? repository.version ?? ''),
         repositoryUrl: repositoryUrl == null ? null : String(repositoryUrl),
         componentName: String(item.componentName ?? item.component_name ?? component.name ?? ''),
         componentVersion: String(item.componentVersion ?? item.component_version ?? component.version ?? ''),
       } as AutonomyMatchedLicenseSource
    }) : []
  const artifacts = Array.isArray(obj.artifacts) ? (obj.artifacts as unknown[]).map((rawItem: unknown) => {
    const item = (rawItem && typeof rawItem === 'object' ? rawItem : {}) as Record<string, unknown>
    return { artifactId: String(item.artifactId ?? item.artifact_id ?? ''), filePath: String(item.filePath ?? item.file_path ?? ''), status: String(item.status ?? ''), limitationReason: String(item.limitationReason ?? item.limitation_reason ?? ''), associationStatus: String(item.associationStatus ?? item.association_status ?? ''), scopeSummary: String(item.scopeSummary ?? item.scope_summary ?? '') } as AutonomyLicenseArtifact
  }) : []
  return {
    taskId: String(obj.taskId ?? obj.task_id ?? taskId), projectId: String(obj.projectId ?? obj.project_id ?? ''),
    taskStatus: String(obj.taskStatus ?? obj.task_status ?? ''),
    provenanceStatus: String(obj.provenanceStatus ?? obj.provenance_status ?? 'unavailable') as AutonomyLicenseResult['provenanceStatus'],
    projectDeclared: (() => {
      const declaredRaw = obj.projectDeclared ?? obj.project_declared
      return Array.isArray(declaredRaw) ? declaredRaw.map(normalizeAutonomyLicenseResultItem) : []
    })(),
    matchedSources, summary: { ...summary, provenanceStatus: summary.provenanceStatus ?? (String(obj.provenanceStatus ?? obj.provenance_status ?? '') as AutonomyLicenseSummary['provenanceStatus']) },
     artifacts,
     limitations: Array.isArray(obj.limitations)
       ? obj.limitations.map((item) => String(item ?? '').trim()).filter(Boolean)
       : [],
     licenseTextIsCopyEvidence: false,
  }
}

/** 将置信度规范为 0–1（后端可能返回百分比） */
function normalizeConfidence(raw: unknown): number {
  const value = Number(raw)
  if (Number.isNaN(value)) {
    return 0
  }
  if (value > 1) {
    return Math.min(value / 100, 1)
  }
  return value
}

/** 规范代码 diff 行类型 */
function normalizeDiffLineKind(raw: unknown): CodeDiffLine['kind'] {
  const text = String(raw ?? '').toLowerCase()
  if (text === 'add' || text === 'insert' || text === 'added') {
    return 'add'
  }
  if (text === 'delete' || text === 'remove' || text === 'removed' || text === 'del') {
    return 'delete'
  }
  if (text === 'spacer' || text === 'gap' || text === 'empty') {
    return 'spacer'
  }
  return 'context'
}

/** 规范 diff 单行 */
function normalizeCodeDiffLine(raw: Record<string, unknown>): CodeDiffLine {
  return {
    kind: normalizeDiffLineKind(raw.kind ?? raw.type ?? raw.changeType),
    lineNumber: Number(raw.lineNumber ?? raw.line_number ?? raw.line ?? 0),
    text: String(raw.text ?? raw.content ?? raw.lineText ?? ''),
  }
}

/** 规范代码 diff 单侧代码块 */
function normalizeCodeDiffPane(raw: unknown, fallbackTitle: string): AutonomyCodeDiffPane {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const linesRaw = obj.lines ?? obj.content ?? obj.diffLines ?? []
  const lines = Array.isArray(linesRaw)
    ? linesRaw.map((line) => normalizeCodeDiffLine(line as Record<string, unknown>))
    : []

  return {
    paneTitle: String(obj.paneTitle ?? obj.pane_title ?? obj.title ?? fallbackTitle),
    lines,
  }
}

/** 规范代码检测告警类型 */
function normalizeCodeAlertType(raw: unknown): AutonomyCodeAlertType {
  const text = String(raw ?? '').toLowerCase().replace(/_/g, '-')
  if (text.includes('fragment') || text.includes('reassembly')) {
    return 'fragment-reassembly'
  }
  return 'high-similarity'
}

/** 规范指纹检测告警类型 */
function normalizeFingerprintAlertType(raw: unknown): AutonomyFingerprintAlertType {
  const text = String(raw ?? '').toLowerCase().replace(/_/g, '-')
  if (text.includes('segment')) {
    return 'segment-fingerprint'
  }
  if (text.includes('sequence') || text.includes('function')) {
    return 'fingerprint-sequence'
  }
  return 'fingerprint-hit'
}

/** 规范来源汇总风险等级 */
function normalizeSourceHitRiskLevel(raw: unknown): AutonomySourceHitRiskLevel {
  const text = String(raw ?? '').toLowerCase()
  if (text === 'high' || text === 'critical') {
    return 'high'
  }
  if (text === 'low' || text === 'info') {
    return 'low'
  }
  return 'medium'
}

/** 规范文件树节点类型（后端 repository/snippet 等） */
function normalizeFileTreeNodeType(raw: unknown): FileTreeNodeType {
  const text = String(raw ?? '').toLowerCase()
  if (
    text === 'file' ||
    text === 'leaf' ||
    text === 'snippet' ||
    text === 'evidence' ||
    text === 'match'
  ) {
    return 'file'
  }
  return 'directory'
}

/** 从路径或 label 提取展示用文件名 */
function basenameFromPath(path: string): string {
  const normalized = path.replace(/\\/g, '/')
  const parts = normalized.split('/').filter(Boolean)
  return parts[parts.length - 1] ?? path
}

/** 规范单个文件树节点（兼容 id / label / repository+snippet 结构） */
function normalizeFileTreeNode(raw: Record<string, unknown>): FileTreeNode {
  const childrenRaw = raw.children ?? raw.nodes
  const children = Array.isArray(childrenRaw)
    ? childrenRaw.map((child) => normalizeFileTreeNode(child as Record<string, unknown>))
    : undefined

  const label = String(raw.label ?? raw.name ?? raw.fileName ?? raw.file_name ?? '')
  const path = raw.path
    ? String(raw.path)
    : raw.filePath
      ? String(raw.filePath)
      : label.includes('/')
        ? label
        : undefined
  const displayName =
    path && label.includes('/') ? basenameFromPath(label) : label || basenameFromPath(path ?? '')

  const node: FileTreeNode = {
    nodeId: String(raw.nodeId ?? raw.id ?? raw.fileId ?? raw.file_id ?? label),
    name: displayName || label,
    type: normalizeFileTreeNodeType(raw.type ?? raw.nodeType),
    path,
    md5: raw.md5 ? String(raw.md5) : undefined,
  }

  const issueRateRaw =
    raw.issueRate ??
    raw.issue_rate ??
    raw.problemRate ??
    raw.problem_rate ??
    raw.similarity ??
    raw.confidence
  if (issueRateRaw !== undefined && issueRateRaw !== null && issueRateRaw !== '') {
    node.issueRate = normalizePercentRate(issueRateRaw)
  }

  if (children && children.length > 0) {
    node.children = children
  }

  return node
}

/** 规范代码检测证据条目 */
function normalizeCodeEvidenceItem(raw: Record<string, unknown>): AutonomyCodeEvidenceItem {
  const evidenceId = String(raw.evidenceId ?? raw.evidence_id ?? raw.id ?? '')
  return {
    evidenceId,
    alertType: normalizeCodeAlertType(raw.alertType ?? raw.alert_type ?? raw.type),
    confidence: normalizeConfidence(raw.confidence ?? raw.score),
    sourceProject: String(raw.sourceProject ?? raw.source_project ?? raw.kbProjectName ?? raw.sourceRepo ?? ''),
    sourceUrl: String(raw.sourceUrl ?? raw.source_url ?? '').trim(),
    sourceVersion: String(raw.sourceVersion ?? raw.source_version ?? raw.kbVersion ?? ''),
    license: String(raw.license ?? raw.licenseId ?? raw.license_id ?? '').trim(),
    tamperAnalysis: String(raw.tamperAnalysis ?? raw.tamper_analysis ?? '').trim(),
    suggestion: String(raw.suggestion ?? raw.advice ?? '').trim(),
    currentCode: normalizeCodeDiffPane(
      raw.currentCode ?? raw.current_code ?? raw.leftCode ?? raw.left,
      '当前被检测代码',
    ),
    suspectedCode: normalizeCodeDiffPane(
      raw.suspectedCode ?? raw.suspected_code ?? raw.rightCode ?? raw.right,
      '疑似来源代码',
    ),
  }
}

/** 规范指纹检测证据条目 */
function normalizeFingerprintEvidenceItem(
  raw: Record<string, unknown>,
): AutonomyFingerprintEvidenceItem {
  return {
    evidenceId: String(raw.evidenceId ?? raw.evidence_id ?? raw.id ?? ''),
    alertType: normalizeFingerprintAlertType(raw.alertType ?? raw.alert_type ?? raw.type),
    confidence: normalizeConfidence(raw.confidence ?? raw.score),
    sourceProject: String(raw.sourceProject ?? raw.source_project ?? raw.kbProjectName ?? ''),
    sourceVersion: String(raw.sourceVersion ?? raw.source_version ?? raw.kbVersion ?? ''),
    description: String(raw.description ?? raw.detail ?? raw.summary ?? ''),
  }
}

/** 根据许可证推断来源汇总风险等级（后端未返回 riskLevel 时兜底） */
function inferSourceHitRiskLevel(license: string, similarity: number): AutonomySourceHitRiskLevel {
  const upper = license.toUpperCase()
  if (upper.includes('GPL') || upper.includes('AGPL')) {
    return 'high'
  }
  if (upper.includes('LGPL') || upper.includes('MPL') || upper.includes('EPL')) {
    return 'medium'
  }
  if (upper.includes('MIT') || upper.includes('APACHE') || upper.includes('BSD')) {
    return similarity >= 0.85 ? 'medium' : 'low'
  }
  if (similarity >= 0.9) {
    return 'high'
  }
  if (similarity >= 0.75) {
    return 'medium'
  }
  return 'low'
}

/** 将树 nodes 字段规范为节点数组（后端可能返回单根对象而非数组） */
function unwrapEvidenceTreeNodes(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) {
    return raw as Record<string, unknown>[]
  }
  if (raw && typeof raw === 'object') {
    return [raw as Record<string, unknown>]
  }
  return []
}

/**
 * 规范自主率检测结果 · 顶部摘要
 * @param raw - 后端 overview 对象
 * @param taskId - 路由 taskId，响应缺字段时兜底
 */
export function normalizeAutonomyDetectResultOverview(
  raw: unknown,
  taskId: string,
): AutonomyDetectResultOverview {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const perf =
    obj.performance && typeof obj.performance === 'object'
      ? (obj.performance as Record<string, unknown>)
      : undefined
  const finishedAtRaw = obj.finishedAt ?? obj.finished_at ?? obj.completedAt ?? obj.createdAt

  const matchedUnits = pickNumberPreferNonZero(obj.matchedUnits, obj.matched_units)
  const riskyUnits = pickNumberPreferNonZero(obj.riskyUnits, obj.risky_units)
  const perfFiles = pickNumberPreferNonZero(perf?.files)
  const perfFingerprints = pickNumberPreferNonZero(perf?.fingerprints)

  return {
    taskId: String(obj.taskId ?? obj.task_id ?? obj.id ?? taskId),
    taskName: String(obj.taskName ?? obj.task_name ?? obj.name ?? ''),
    projectName: String(obj.projectName ?? obj.project_name ?? obj.projectId ?? obj.project_id ?? ''),
    status: normalizeTaskStatus(
      obj.status ?? (obj.resultAvailable === true ? 'success' : obj.reviewStatus),
    ),
    finishedAt:
      finishedAtRaw === null || finishedAtRaw === undefined || finishedAtRaw === ''
        ? null
        : String(finishedAtRaw),
    // 真实值在 overallAutonomyRate；totalAutonomyRate 常为占位 0
    totalAutonomyRate: pickAutonomyRate(
      obj.overallAutonomyRate,
      obj.overall_autonomy_rate,
      obj.netAutonomyRate,
      obj.net_autonomy_rate,
      obj.overallRate,
      obj.overall_rate,
      obj.totalAutonomyRate,
      obj.total_autonomy_rate,
    ),
    riskAutonomyRate: pickAutonomyRate(
      obj.riskAutonomyRate,
      obj.risk_autonomy_rate,
      obj.riskRate,
      obj.risk_rate,
    ),
    issueFileCount: pickNumberPreferNonZero(
      perfFiles,
      matchedUnits,
      obj.issueFileCount,
      obj.issue_file_count,
      obj.problemFileCount,
    ),
    codeIssueCount: pickNumberPreferNonZero(
      matchedUnits,
      riskyUnits,
      obj.codeIssueCount,
      obj.code_issue_count,
    ),
    fingerprintIssueCount: pickNumberPreferNonZero(
      perfFingerprints,
      obj.fingerprintIssueCount,
      obj.fingerprint_issue_count,
    ),
    licenseSummary: normalizeLicenseSummary(obj.licenseSummary ?? obj.license_summary),
  }
}

/** 合并任务详情，补全 overview 缺失的任务名/项目名/状态 */
export function mergeAutonomyOverviewWithTask(
  overview: AutonomyDetectResultOverview,
  task: { taskName: string; projectName: string; status: AutonomyDetectResultOverview['status']; finishedAt?: string | null },
): AutonomyDetectResultOverview {
  return {
    ...overview,
    taskName: overview.taskName || task.taskName,
    projectName: overview.projectName || task.projectName,
    status: overview.status || task.status,
    finishedAt: overview.finishedAt ?? task.finishedAt ?? null,
  }
}

/** 规范自主率检测结果 · 证据文件树 */
export function normalizeAutonomyEvidenceTree(raw: unknown): FileTreeData {
  if (Array.isArray(raw)) {
    return {
      nodes: raw.map((item) => normalizeFileTreeNode(item as Record<string, unknown>)),
    }
  }

  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const nodesRaw = obj.nodes ?? obj.tree ?? obj.children ?? obj.items ?? obj.root
  const nodes = unwrapEvidenceTreeNodes(nodesRaw).map((item) => normalizeFileTreeNode(item))

  return { nodes }
}

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

/** 解析后端 file detail 的 evidence 数组 */
function readAutonomyFileEvidenceList(raw: Record<string, unknown>): Record<string, unknown>[] {
  const listRaw = raw.evidence ?? raw.evidences ?? raw.hits ?? raw.items
  if (!Array.isArray(listRaw)) {
    return []
  }
  return listRaw as Record<string, unknown>[]
}

/** 根据后端 evidence.type 判断归入代码检测还是指纹检测 */
function resolveAutonomyEvidenceKind(raw: Record<string, unknown>): 'code' | 'fingerprint' {
  const type = String(raw.type ?? raw.evidenceType ?? raw.evidence_type ?? '')
    .toLowerCase()
    .replace(/_/g, '-')

  if (
    type === 'snippet' ||
    type === 'code' ||
    type === 'high-similarity' ||
    type === 'fragment-reassembly' ||
    type.includes('fragment') ||
    type.includes('reassembly')
  ) {
    return 'code'
  }

  if (
    type === 'fingerprint' ||
    type.includes('fingerprint') ||
    type === 'simhash' ||
    type === 'hash'
  ) {
    return 'fingerprint'
  }

  const rawMeta =
    raw.raw && typeof raw.raw === 'object' ? (raw.raw as Record<string, unknown>) : null
  const detector = String(rawMeta?.detector ?? '').toLowerCase()
  if (detector.includes('fingerprint') && !detector.includes('token')) {
    return 'fingerprint'
  }

  // 含行号/文件路径且无明确指纹类型时，按代码 snippet 处理
  if (raw.startLine != null || raw.start_line != null || raw.filePath != null || raw.file_path != null) {
    return 'code'
  }

  return 'fingerprint'
}

function evidenceSnippetToFingerprint(raw: Record<string, unknown>): AutonomyFingerprintEvidenceItem {
  const tamper = String(raw.tamperAnalysis ?? raw.tamper_analysis ?? '').trim()
  const suggestion = String(raw.suggestion ?? raw.advice ?? '').trim()
  const description = [tamper, suggestion].filter(Boolean).join('\n')

  const rawDetector =
    raw.raw && typeof raw.raw === 'object'
      ? String((raw.raw as Record<string, unknown>).detector ?? '')
      : ''

  return {
    evidenceId: String(raw.evidenceId ?? raw.evidence_id ?? raw.id ?? ''),
    alertType: rawDetector.includes('simhash') ? 'fingerprint-hit' : 'segment-fingerprint',
    confidence: normalizeConfidence(raw.confidence ?? raw.similarity ?? raw.score),
    sourceProject: String(raw.sourceRepo ?? raw.sourceProject ?? raw.source_project ?? ''),
    sourceVersion: String(raw.sourceVersion ?? raw.source_version ?? ''),
    description: description || String(raw.summary ?? '—'),
  }
}

/** 将后端 snippet 命中转为代码检测证据（无 diff 正文时用行号与来源文件占位） */
function evidenceSnippetToCode(
  raw: Record<string, unknown>,
  fallbackFileName: string,
): AutonomyCodeEvidenceItem {
  const filePath = String(raw.filePath ?? raw.file_path ?? fallbackFileName)
  const fileLabel = basenameFromPath(filePath) || fallbackFileName
  const startLine = Number(raw.startLine ?? raw.start_line ?? 0)
  const endLine = Number(raw.endLine ?? raw.end_line ?? startLine)
  const lineRange = startLine > 0 && endLine > 0 ? `L${startLine}-${endLine}` : ''
  const sourceRepo = String(raw.sourceRepo ?? raw.sourceProject ?? '')
  const sourceFile = String(raw.sourceFile ?? raw.source_file ?? '')
  const sourceVersion = String(raw.sourceVersion ?? raw.source_version ?? '')

  return {
    evidenceId: String(raw.evidenceId ?? raw.evidence_id ?? raw.id ?? ''),
    alertType: 'high-similarity',
    confidence: normalizeConfidence(raw.confidence ?? raw.similarity ?? raw.score),
    sourceProject: sourceRepo,
    sourceUrl: String(raw.sourceUrl ?? raw.source_url ?? '').trim(),
    sourceVersion,
    license: String(raw.license ?? raw.licenseId ?? raw.license_id ?? '').trim(),
    tamperAnalysis: String(raw.tamperAnalysis ?? raw.tamper_analysis ?? '').trim(),
    suggestion: String(raw.suggestion ?? raw.advice ?? '').trim(),
    currentCode: {
      paneTitle: `当前被检测代码 · ${fileLabel}${lineRange ? ` ${lineRange}` : ''}`,
      lines: [
        {
          kind: 'context',
          lineNumber: startLine > 0 ? startLine : 1,
          text: `命中文件：${filePath}${lineRange ? `（${lineRange}）` : ''}`,
        },
      ],
    },
    suspectedCode: {
      paneTitle: `疑似来源 · ${sourceRepo || '未知项目'} ${sourceFile}`.trim(),
      lines: [
        {
          kind: 'context',
          lineNumber: 1,
          text: sourceFile ? `${sourceRepo}/${sourceFile}`.replace(/^\//, '') : '—',
        },
      ],
    },
  }
}

/**
 * 规范文件详情摘要
 * 只读后端 summary 字段；evidence 属于证据模块，不参与摘要取值。
 * 仅 fileId / fileName 允许用树节点携带的值兜底（后端 summary 里这两项常为空串）。
 */
function buildAutonomyFileDetailSummary(
  summaryRaw: unknown,
  fallback: { fileId: string; fileName: string },
): AutonomyFileDetailSummary {
  const summaryObj = (summaryRaw && typeof summaryRaw === 'object' ? summaryRaw : {}) as Record<
    string,
    unknown
  >

  return {
    fileId: pickFirstNonEmptyString(summaryObj.fileId, summaryObj.file_id, fallback.fileId),
    fileName: pickFirstNonEmptyString(summaryObj.fileName, summaryObj.file_name, fallback.fileName),
    fileTypeLabel: pickFirstNonEmptyString(
      summaryObj.fileTypeLabel,
      summaryObj.file_type_label,
      '—',
    ),
    issueLineRanges: pickFirstNonEmptyString(
      summaryObj.issueLineRanges,
      summaryObj.issue_line_ranges,
      '—',
    ),
    overallIssueRate: pickAutonomyRate(
      summaryObj.overallIssueRate,
      summaryObj.overall_issue_rate,
      summaryObj.issueRate,
    ),
    sourceProject: pickFirstNonEmptyString(
      summaryObj.sourceProject,
      summaryObj.source_project,
      '—',
    ),
    sourceUrl: pickFirstNonEmptyString(summaryObj.sourceUrl, summaryObj.source_url),
    sourceVersion: pickFirstNonEmptyString(
      summaryObj.sourceVersion,
      summaryObj.source_version,
      '—',
    ),
    maxConfidence: normalizeConfidence(
      pickNumberPreferNonZero(summaryObj.maxConfidence, summaryObj.max_confidence),
    ),
  }
}

/** 从 evidence 数组构建代码/指纹证据（后端未填充 codeEvidences 字段时） */
function buildEvidencesFromSnippetList(
  evidenceList: Record<string, unknown>[],
  fallbackFileName: string,
): {
  codeEvidences: AutonomyCodeEvidenceItem[]
  fingerprintEvidences: AutonomyFingerprintEvidenceItem[]
} {
  const codeEvidences: AutonomyCodeEvidenceItem[] = []
  const fingerprintEvidences: AutonomyFingerprintEvidenceItem[] = []

  for (const item of evidenceList) {
    if (resolveAutonomyEvidenceKind(item) === 'code') {
      codeEvidences.push(evidenceSnippetToCode(item, fallbackFileName))
    } else {
      fingerprintEvidences.push(evidenceSnippetToFingerprint(item))
    }
  }

  return { codeEvidences, fingerprintEvidences }
}

/**
 * 规范自主率检测结果 · 单文件详情
 * @param raw - 后端 file detail 对象
 * @param fallback - 路由/树节点携带的 fileId、fileName
 */
export function normalizeAutonomyFileDetail(
  raw: unknown,
  fallback: { fileId: string; fileName: string },
): AutonomyFileDetail {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const evidenceList = readAutonomyFileEvidenceList(obj)

  let codeEvidences = normalizeList(
    obj.codeEvidences ?? obj.code_evidences ?? obj.codeEvidence,
    normalizeCodeEvidenceItem,
  )
  let fingerprintEvidences = normalizeList(
    obj.fingerprintEvidences ?? obj.fingerprint_evidences ?? obj.fingerprintEvidence,
    normalizeFingerprintEvidenceItem,
  )

  if (codeEvidences.length === 0 && fingerprintEvidences.length === 0 && evidenceList.length > 0) {
    const built = buildEvidencesFromSnippetList(evidenceList, fallback.fileName)
    codeEvidences = built.codeEvidences
    fingerprintEvidences = built.fingerprintEvidences
  }

  return {
    summary: buildAutonomyFileDetailSummary(obj.summary, fallback),
    codeEvidences,
    fingerprintEvidences,
  }
}

/** 解包来源汇总分页 payload（兼容 data 嵌套、顶层 list） */
function unwrapAutonomySourceHitPageRaw(raw: unknown): unknown {
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
    return unwrapAutonomySourceHitPageRaw(obj.data)
  }
  return obj
}

/** 合并 snippet / hit 等嵌套字段到顶层，便于列表项映射 */
function flattenSourceHitRawItem(raw: Record<string, unknown>): Record<string, unknown> {
  const nestedKeys = ['snippet', 'hit', 'evidence', 'detail', 'payload', 'record'] as const
  let merged: Record<string, unknown> = { ...raw }
  for (const key of nestedKeys) {
    const nested = raw[key]
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      merged = { ...(nested as Record<string, unknown>), ...merged }
    }
  }
  return merged
}

/** 规范来源汇总列表项（兼容 records 内 snippet 结构） */
export function normalizeAutonomySourceHitItem(raw: Record<string, unknown>): AutonomySourceHitItem {
  const item = flattenSourceHitRawItem(raw)
  const filePath = pickFirstNonEmptyString(
    item.filePath,
    item.file_path,
    item.path,
    item.hitFilePath,
    item.hit_file_path,
  )
  const hitFileNamesRaw = item.hitFileNames ?? item.hit_file_names ?? item.files ?? item.fileNames
  let hitFileNames: string[] = []
  if (Array.isArray(hitFileNamesRaw)) {
    hitFileNames = hitFileNamesRaw.map((name) => String(name)).filter(Boolean)
  } else if (typeof hitFileNamesRaw === 'string' && hitFileNamesRaw.trim()) {
    hitFileNames = [hitFileNamesRaw.trim()]
  } else if (filePath) {
    const base = basenameFromPath(filePath)
    hitFileNames = base && base !== filePath ? [base, filePath] : [filePath]
  }

  const license = pickFirstNonEmptyString(item.license, item.licenseName, item.license_name, '—')
  const similarity = normalizeConfidence(item.similarity ?? item.confidence ?? item.score)
  const explicitRisk = item.riskLevel ?? item.risk_level

  return {
    hitId: pickFirstNonEmptyString(item.hitId, item.hit_id, item.id, item.fileId, item.file_id),
    kbProjectId: pickFirstNonEmptyString(
      item.kbProjectId,
      item.kb_project_id,
      item.sourceProjectId,
      item.source_project_id,
      item.sourceRepo,
      item.source_repo,
    ),
    kbProjectName: pickFirstNonEmptyString(
      item.kbProjectName,
      item.kb_project_name,
      item.sourceProject,
      item.source_project,
      item.sourceRepo,
      item.source_repo,
    ),
    kbVersion: pickFirstNonEmptyString(
      item.kbVersion,
      item.kb_version,
      item.sourceVersion,
      item.source_version,
    ),
    filePath,
    hitFileNames,
    license,
    riskLevel:
      explicitRisk !== undefined && explicitRisk !== null && explicitRisk !== ''
        ? normalizeSourceHitRiskLevel(explicitRisk)
        : inferSourceHitRiskLevel(license, similarity),
  }
}

/** 规范来源汇总分页结果（兼容 records；total 为 0 时用 list 长度兜底） */
export function normalizeAutonomySourceHitPage(raw: unknown) {
  const page = normalizePageResult(
    unwrapAutonomySourceHitPageRaw(raw),
    normalizeAutonomySourceHitItem,
  )
  if (page.list.length > 0 && page.total < page.list.length) {
    return { ...page, total: page.list.length }
  }
  return page
}

/**
 * 来源汇总查询参数 → 后端 query（空值不下发）
 * @param params - 分页与筛选
 */
export function autonomySourceHitQueryParamsToApi(
  params: AutonomySourceHitQueryParams,
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
