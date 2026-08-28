import type { PageResult } from '@/types/common'
import type { FileTreeData, FileTreeNode, FileTreeNodeType } from '@/types/fileTree'
import type {
  CategoryCoverageStat,
  CollectionMethodCategoryCount,
  CollectionMethodCoverageStat,
  CoverageGapImpact,
  CoveragePendingItem,
  CoverageUpdateTrendWeek,
  CreateKbProjectResult,
  FetchKbVersionUpdateResult,
  KbCollectMode,
  KbIntakeTodoItem,
  KbIntakeTodoStatus,
  KbProject,
  KbProjectCategory,
  KbProjectFileDetail,
  KbProjectFileMetadataExportResult,
  KbProjectFingerprintSummaryRow,
  KbProjectOverview,
  KbQuarterUpdateOverview,
  KbQuarterUpdateRecord,
  KbQuarterUpdateStatus,
  KbVersion,
  KbVersionOverview,
  KbVersionSelectOption,
  KbVersionStatus,
  KnowledgeCoverageOverview,
  SyncVulnSourceParams,
  UpdateKbProjectParams,
  UploadKbVersionPackageResult,
  VulnItemDetail,
  VulnItemExportParams,
  VulnItemLevel,
  VulnItemListItem,
  VulnItemOverview,
  VulnItemQuickSearchFilters,
  VulnItemQuickSearchSuggestion,
  VulnItemReferenceLink,
  VulnItemStatus,
  VulnKnowledgeOverview,
  VulnRiskLevelCount,
  VulnRiskSummary,
  VulnRiskSummarySource,
  VulnSource,
  VulnSourceCode,
  VulnSourceKind,
  VulnSourceQueryParams,
  VulnSyncAllPreview,
  VulnSyncStatus,
} from '@/types/knowledge'
import { normalizeList, normalizePageResult } from '@/utils/pageResultAdapter'
import { COVERAGE_GAP_IMPACT_LABEL } from '@/utils/coverageDisplay'
import {
  KB_COLLECT_MODE_LABEL,
  KB_INTAKE_TODO_STATUS_LABEL,
  KB_PROJECT_CATEGORY_LABEL,
  KB_PROJECT_CATEGORY_ORDER,
} from '@/utils/knowledgeDisplay'
import { KB_QUARTER_UPDATE_STATUS_LABEL } from '@/utils/kbQuarterUpdateDisplay'
import { KB_VERSION_STATUS_LABEL } from '@/utils/knowledgeVersionDisplay'
import { VULN_ITEM_LEVEL_LABEL, VULN_ITEM_STATUS_LABEL } from '@/utils/vulnItemDisplay'
import { VULN_SOURCE_CODE_LABEL, VULN_SYNC_STATUS_LABEL } from '@/utils/vulnKnowledgeDisplay'

// ─── 通用取值工具 ─────────────────────────────────────────────────────────────

/** 把未知响应片段安全地当作对象使用（null / 数组 / 基本类型统一回落为空对象） */
function toRecord(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>
  }
  return {}
}

/** 取第一个「有值」的候选（null / undefined / 空字符串视为无值） */
function pickDefined(candidates: unknown[]): unknown {
  for (const candidate of candidates) {
    if (candidate !== undefined && candidate !== null && candidate !== '') {
      return candidate
    }
  }
  return undefined
}

/**
 * 取第一个非空候选并转字符串
 * @param candidates - 按优先级排列的候选值（camelCase 在前、snake_case 在后）
 * @param fallback - 全部为空时的默认值
 */
function pickString(candidates: unknown[], fallback = ''): string {
  const value = pickDefined(candidates)
  return value === undefined ? fallback : String(value)
}

/**
 * 取第一个可解析为有限数字的候选
 * @param candidates - 候选值
 * @param fallback - 全部缺失或非法时的默认值
 */
function pickNumber(candidates: unknown[], fallback = 0): number {
  const value = pickDefined(candidates)
  if (value === undefined) return fallback
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

/** 取第一个可解析数字；全部缺失时返回 null（列表按「—」展示，如离线包无记录数） */
function pickNullableNumber(candidates: unknown[]): number | null {
  const value = pickDefined(candidates)
  if (value === undefined) return null
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

/** 取第一个非空字符串；全部缺失时返回 null（如离线包无同步周期） */
function pickNullableString(candidates: unknown[]): string | null {
  const value = pickDefined(candidates)
  return value === undefined ? null : String(value)
}

/** 规范字符串数组：兼容数组、JSON 字符串、以及分号/逗号/顿号分隔的字符串 */
function toStringArray(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((item) => String(item ?? '').trim()).filter(Boolean)
  }
  const text = String(raw ?? '').trim()
  if (!text) return []
  if (text.startsWith('[')) {
    try {
      const parsed: unknown = JSON.parse(text)
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item ?? '').trim()).filter(Boolean)
      }
    } catch {
      // JSON 解析失败时降级为分隔符切分
    }
  }
  return text
    .split(/[;,；，、]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

/** 枚举归一化 key：小写 + 连字符/空格转下划线，吸收 camelCase 之外的书写差异 */
function toEnumKey(raw: unknown): string {
  return String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, '_')
}

/** 由「枚举值 → 中文文案」映射生成反查表，使后端返回英文枚举或中文标签都能识别 */
function buildEnumLookup<T extends string>(labels: Record<T, string>): Record<string, T> {
  const lookup: Record<string, T> = {}
  for (const [key, label] of Object.entries(labels) as [T, string][]) {
    lookup[key] = key
    lookup[label] = key
  }
  return lookup
}

/**
 * 按反查表解析枚举值，识别不了时返回 fallback（不抛异常）
 * @param raw - 后端原始值
 * @param lookup - 反查表（含英文枚举与中文标签）
 * @param fallback - 兜底枚举值
 */
function resolveEnum<T extends string>(
  raw: unknown,
  lookup: Record<string, T>,
  fallback: T,
): T {
  const text = String(raw ?? '').trim()
  if (text && lookup[text]) {
    return lookup[text]
  }
  return lookup[toEnumKey(text)] ?? fallback
}

/**
 * 用后端返回的非空字段覆盖兜底对象
 * 变更类接口后端常只回传主键或状态，缺失字段用提交值补齐，避免页面拿到空数据
 */
function mergeDefinedFields(
  fallback: Record<string, unknown>,
  raw: unknown,
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...fallback }
  for (const [key, value] of Object.entries(toRecord(raw))) {
    if (value !== null && value !== undefined && value !== '') {
      merged[key] = value
    }
  }
  return merged
}

/** 过滤掉空值后的 query 对象，避免把 `''` 当筛选条件下发给后端 */
export function toKnowledgeQueryParams(params: Record<string, unknown>): Record<string, unknown> {
  const query: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') {
      continue
    }
    query[key] = value
  }
  return query
}

// ─── 枚举反查表 ───────────────────────────────────────────────────────────────

const KB_PROJECT_CATEGORY_LOOKUP: Record<string, KbProjectCategory> = {
  ...buildEnumLookup(KB_PROJECT_CATEGORY_LABEL),
}

const KB_COLLECT_MODE_LOOKUP: Record<string, KbCollectMode> = {
  ...buildEnumLookup(KB_COLLECT_MODE_LABEL),
  // 后端在「添加项目」链路复用 SourceIngest 的取值，这里一并归一
  repo_pull: 'cloud_repo',
  cloud_pull: 'cloud_repo',
  repo: 'cloud_repo',
  git: 'cloud_repo',
  云端拉取: 'cloud_repo',
  upload_source_package: 'upload_package',
  upload: 'upload_package',
  package: 'upload_package',
  上传包: 'upload_package',
}

const KB_INTAKE_TODO_STATUS_LOOKUP: Record<string, KbIntakeTodoStatus> = {
  ...buildEnumLookup(KB_INTAKE_TODO_STATUS_LABEL),
  running: 'in_progress',
  processing: 'in_progress',
  waiting: 'pending',
  todo: 'pending',
  warning: 'alert',
  error: 'alert',
  failed: 'alert',
}

const KB_VERSION_STATUS_LOOKUP: Record<string, KbVersionStatus> = {
  ...buildEnumLookup(KB_VERSION_STATUS_LABEL),
  // openapi 版本状态枚举为 active/archived/indexing，前端用 ready 表示 active
  active: 'ready',
  success: 'ready',
  done: 'ready',
  normal: 'ready',
  building: 'indexing',
  index_building: 'indexing',
  archive: 'archived',
}

const KB_QUARTER_UPDATE_STATUS_LOOKUP: Record<string, KbQuarterUpdateStatus> = {
  ...buildEnumLookup(KB_QUARTER_UPDATE_STATUS_LABEL),
  running: 'in_progress',
  processing: 'in_progress',
  success: 'completed',
  done: 'completed',
  error: 'failed',
}

const COVERAGE_GAP_IMPACT_LOOKUP: Record<string, CoverageGapImpact> = {
  ...buildEnumLookup(COVERAGE_GAP_IMPACT_LABEL),
  p0: 'high',
  p1: 'medium',
  p2: 'low',
  critical: 'high',
  urgent: 'high',
  normal: 'medium',
  minor: 'low',
}

const VULN_SYNC_STATUS_LOOKUP: Record<string, VulnSyncStatus> = {
  ...buildEnumLookup(VULN_SYNC_STATUS_LABEL),
  // openapi 同步状态为 normal/syncing/failed/offline，前端只有 normal/delayed/warning
  ok: 'normal',
  success: 'normal',
  synced: 'normal',
  syncing: 'delayed',
  running: 'delayed',
  pending: 'delayed',
  failed: 'warning',
  error: 'warning',
  offline: 'warning',
  abnormal: 'warning',
}

const VULN_SOURCE_CODE_LOOKUP: Record<string, VulnSourceCode> = {
  ...buildEnumLookup(VULN_SOURCE_CODE_LABEL),
  github: 'github_advisory',
  ghsa: 'github_advisory',
  github_security_advisory: 'github_advisory',
}

const VULN_ITEM_LEVEL_LOOKUP: Record<string, VulnItemLevel> = {
  ...buildEnumLookup(VULN_ITEM_LEVEL_LABEL),
  // 后端严重级别含 critical，前端列表只有三档，critical 并入 high
  critical: 'high',
  severe: 'high',
  高危: 'high',
  中危: 'medium',
  低危: 'low',
  info: 'low',
  none: 'low',
}

const VULN_ITEM_STATUS_LOOKUP: Record<string, VulnItemStatus> = {
  ...buildEnumLookup(VULN_ITEM_STATUS_LABEL),
  normal: 'synced',
  ok: 'synced',
  review: 'needs_review',
  reviewing: 'needs_review',
  pending: 'pending_action',
  todo: 'pending_action',
}

// ─── 知识库开源项目 ───────────────────────────────────────────────────────────

/** 规范知识库项目分类（兼容英文枚举与中文标签），无法识别时按通用依赖处理 */
function normalizeKbProjectCategory(raw: unknown): KbProjectCategory {
  return resolveEnum(raw, KB_PROJECT_CATEGORY_LOOKUP, 'general_dependency')
}

/** 规范采集方式，无法识别时按云端仓库拉取处理 */
function normalizeKbCollectMode(raw: unknown): KbCollectMode {
  return resolveEnum(raw, KB_COLLECT_MODE_LOOKUP, 'cloud_repo')
}

/** 规范项目标签：后端可能给数组或字符串，页面按单行字符串展示 */
function normalizeKbProjectTags(raw: unknown): string | undefined {
  if (typeof raw === 'string') {
    return raw.trim() || undefined
  }
  const list = toStringArray(raw)
  return list.length > 0 ? list.join(',') : undefined
}

/** 将后端知识库项目对象规范为前端 KbProject */
export function normalizeKbProject(raw: Record<string, unknown>): KbProject {
  return {
    kbProjectId: pickString([raw.kbProjectId, raw.kb_project_id, raw.projectId, raw.project_id, raw.id]),
    projectName: pickString([raw.projectName, raw.project_name, raw.name]),
    category: normalizeKbProjectCategory(raw.category ?? raw.projectCategory ?? raw.project_category),
    collectMode: normalizeKbCollectMode(
      raw.collectMode ?? raw.collect_mode ?? raw.sourceMode ?? raw.source_mode,
    ),
    latestVersion: pickString([raw.latestVersion, raw.latest_version, raw.currentVersion, raw.version], '—'),
    versionCount: pickNumber([raw.versionCount, raw.version_count]),
    referencedProjectCount: pickNumber([
      raw.referencedProjectCount,
      raw.referenced_project_count,
      raw.refProjectCount,
      raw.projectCount,
      raw.project_count,
    ]),
    tags: normalizeKbProjectTags(raw.tags ?? raw.tag ?? raw.labels),
    updatedAt: pickString([raw.updatedAt, raw.updated_at, raw.lastUpdatedAt, raw.last_updated_at]),
  }
}

/** 规范知识库项目分页结果 */
export function normalizeKbProjectPage(raw: unknown): PageResult<KbProject> {
  return normalizePageResult(raw, normalizeKbProject)
}

/** 规范知识库管理页顶部概览（缺失分类补 0，保证扇形图四段齐全） */
export function normalizeKbProjectOverview(raw: unknown): KbProjectOverview {
  const obj = toRecord(raw)
  const countsRaw = toRecord(obj.categoryCounts ?? obj.category_counts ?? obj.categories)

  const categoryCounts = {} as Record<KbProjectCategory, number>
  for (const category of KB_PROJECT_CATEGORY_ORDER) {
    categoryCounts[category] = pickNumber([countsRaw[category], countsRaw[KB_PROJECT_CATEGORY_LABEL[category]]])
  }

  const summedTotal = KB_PROJECT_CATEGORY_ORDER.reduce(
    (sum, category) => sum + categoryCounts[category],
    0,
  )

  return {
    totalCount: pickNumber([obj.totalCount, obj.total_count, obj.total], summedTotal),
    categoryCounts,
  }
}

/** 规范入库待办状态 */
function normalizeKbIntakeTodoStatus(raw: unknown): KbIntakeTodoStatus {
  return resolveEnum(raw, KB_INTAKE_TODO_STATUS_LOOKUP, 'pending')
}

/** 将后端入库待办行规范为 KbIntakeTodoItem */
export function normalizeKbIntakeTodoItem(raw: Record<string, unknown>): KbIntakeTodoItem {
  return {
    todoId: pickString([raw.todoId, raw.todo_id, raw.id]),
    projectName: pickString([raw.projectName, raw.project_name, raw.name]),
    status: normalizeKbIntakeTodoStatus(raw.status),
    detail: pickString([
      raw.failureReason,
      raw.failure_reason,
      raw.detail,
      raw.description,
      raw.remark,
      raw.message,
    ]),
  }
}

/** 规范入库待办分页结果 */
export function normalizeKbIntakeTodoPage(raw: unknown): PageResult<KbIntakeTodoItem> {
  return normalizePageResult(raw, normalizeKbIntakeTodoItem)
}

/** 规范添加开源项目响应（后端异步处理，仅回传解析任务 ID） */
export function normalizeCreateKbProjectResult(raw: unknown): CreateKbProjectResult {
  const obj = toRecord(raw)
  const parseTaskId = pickString([obj.parseTaskId, obj.parse_task_id, obj.taskId, obj.task_id])
  return parseTaskId ? { parseTaskId } : {}
}

/**
 * 编辑开源项目 · PUT 请求体
 * 同时提交 camelCase 与 snake_case 采集方式字段，兼容后端两种命名
 */
export function updateKbProjectParamsToApi(data: UpdateKbProjectParams): Record<string, unknown> {
  return {
    projectName: data.projectName,
    category: data.category,
    collectMode: data.collectMode,
    collect_mode: data.collectMode,
    tags: data.tags ?? '',
  }
}

/**
 * 规范编辑开源项目响应
 * 后端 PUT 可能只回传部分字段，缺失处用本次提交的值兜底，保证列表行不被清空
 * @param raw - 后端响应 data
 * @param kbProjectId - 被编辑的项目 ID
 * @param submitted - 本次提交的可编辑字段
 */
export function normalizeUpdatedKbProject(
  raw: unknown,
  kbProjectId: string,
  submitted: UpdateKbProjectParams,
): KbProject {
  return normalizeKbProject(
    mergeDefinedFields(
      {
        kbProjectId,
        projectName: submitted.projectName,
        category: submitted.category,
        collectMode: submitted.collectMode,
        tags: submitted.tags,
      },
      raw,
    ),
  )
}

/** 规范项目目录页的版本下拉选项列表 */
export function normalizeKbVersionSelectOptions(raw: unknown): KbVersionSelectOption[] {
  return normalizeList(raw, (item) => ({
    versionId: pickString([item.versionId, item.version_id, item.value, item.id]),
    versionNo: pickString([item.versionNo, item.version_no, item.label, item.version]),
  }))
}

// ─── 项目目录树与文件详情 ─────────────────────────────────────────────────────

/** 规范目录树节点类型：有子节点或显式声明目录时按 directory 处理 */
function normalizeFileTreeNodeType(raw: unknown, hasChildren: boolean): FileTreeNodeType {
  const key = toEnumKey(raw)
  if (key === 'file' || key === 'leaf' || key === 'blob') {
    return 'file'
  }
  if (key === 'directory' || key === 'dir' || key === 'folder' || key === 'tree') {
    return 'directory'
  }
  return hasChildren ? 'directory' : 'file'
}

/** 递归规范知识库目录树单节点（兼容 children / nodes / items 三种子节点字段） */
function normalizeKbFileTreeNode(raw: Record<string, unknown>): FileTreeNode {
  const childrenRaw = raw.children ?? raw.nodes ?? raw.items ?? raw.subNodes
  const children = Array.isArray(childrenRaw)
    ? childrenRaw.map((child) => normalizeKbFileTreeNode(toRecord(child)))
    : undefined

  const path = pickString([raw.path, raw.filePath, raw.file_path, raw.fullPath, raw.full_path])
  const name = pickString([raw.name, raw.fileName, raw.file_name, raw.label, raw.title], path)
  const md5 = pickString([raw.md5, raw.md5Hash, raw.md5_hash, raw.fileMd5, raw.file_md5])

  const node: FileTreeNode = {
    nodeId: pickString([raw.nodeId, raw.node_id, raw.fileNodeId, raw.file_node_id, raw.id], path || name),
    name,
    type: normalizeFileTreeNodeType(raw.type ?? raw.nodeType ?? raw.node_type, Boolean(children?.length)),
  }

  if (path) node.path = path
  if (md5) node.md5 = md5
  if (children && children.length > 0) node.children = children

  return node
}

/** 将路径拆分为目录层级，兼容 Windows 分隔符与 `./` 前缀。 */
function splitKbDirectoryPath(path: string): string[] {
  return path
    .replace(/\\/g, '/')
    .split('/')
    .filter((segment) => segment && segment !== '.')
}

/** 按名称排序：目录在前、文件在后，递归保持层级清晰。 */
function sortKbDirectoryNodes(nodes: FileTreeNode[]): FileTreeNode[] {
  return nodes
    .map((node) => ({
      ...node,
      children: node.children ? sortKbDirectoryNodes(node.children) : undefined,
    }))
    .sort((left, right) => {
      if (left.type !== right.type) {
        return left.type === 'directory' ? -1 : 1
      }
      return left.name.localeCompare(right.name)
    })
}

/**
 * 后端可能以扁平 nodes 返回完整 `path`。这里将路径中的中间段补为目录节点，
 * 使知识库目录与自主率证据树一样按目录层级展开；叶子文件保留后端 nodeId。
 */
function buildKbDirectoryTree(nodes: FileTreeNode[]): FileTreeNode[] {
  const roots: FileTreeNode[] = []
  const directoryByPath = new Map<string, FileTreeNode>()

  function getOrCreateDirectory(pathSegments: string[]): FileTreeNode {
    const directoryPath = pathSegments.join('/')
    const existing = directoryByPath.get(directoryPath)
    if (existing) {
      return existing
    }

    const parent = pathSegments.length > 1
      ? getOrCreateDirectory(pathSegments.slice(0, -1))
      : undefined
    const directory: FileTreeNode = {
      nodeId: `directory:${directoryPath}`,
      name: pathSegments[pathSegments.length - 1] ?? directoryPath,
      type: 'directory',
      path: directoryPath,
      children: [],
    }
    directoryByPath.set(directoryPath, directory)
    ;(parent?.children ?? roots).push(directory)
    return directory
  }

  function appendNode(node: FileTreeNode) {
    const pathSegments = node.path ? splitKbDirectoryPath(node.path) : []

    if (node.type === 'directory' && pathSegments.length > 0) {
      const directory = getOrCreateDirectory(pathSegments)
      directory.nodeId = node.nodeId || directory.nodeId
      directory.md5 = node.md5
      for (const child of node.children ?? []) {
        appendNode(child)
      }
      return
    }

    if (node.type === 'file' && pathSegments.length > 0) {
      const parent = pathSegments.length > 1
        ? getOrCreateDirectory(pathSegments.slice(0, -1))
        : undefined
      ;(parent?.children ?? roots).push({
        ...node,
        name: pathSegments[pathSegments.length - 1] ?? node.name,
      })
      return
    }

    roots.push({
      ...node,
      children: node.children ? buildKbDirectoryTree(node.children) : undefined,
    })
  }

  for (const node of nodes) {
    appendNode(node)
  }

  return sortKbDirectoryNodes(roots)
}

/** 规范知识库项目目录树（兼容后端直接返回数组或 { nodes } 包裹） */
export function normalizeKbProjectDirectoryTree(raw: unknown): FileTreeData {
  if (Array.isArray(raw)) {
    return { nodes: buildKbDirectoryTree(raw.map((item) => normalizeKbFileTreeNode(toRecord(item)))) }
  }
  const obj = toRecord(raw)
  const nodesRaw = obj.nodes ?? obj.tree ?? obj.children ?? obj.list ?? obj.items
  if (Array.isArray(nodesRaw)) {
    return {
      nodes: buildKbDirectoryTree(
        nodesRaw.map((item) => normalizeKbFileTreeNode(toRecord(item))),
      ),
    }
  }
  return { nodes: [] }
}

/** 规范文件详情中的指纹与来源摘要行 */
function normalizeFingerprintSummaryRow(
  raw: Record<string, unknown>,
  index: number,
): KbProjectFingerprintSummaryRow {
  return {
    rowId: pickString([raw.rowId, raw.row_id, raw.id], `fp-${index + 1}`),
    dimension: pickString([raw.dimension, raw.name, raw.type, raw.label]),
    hitCount: pickNumber([raw.hitCount, raw.hit_count, raw.count]),
    maxConfidence: pickNumber([raw.maxConfidence, raw.max_confidence, raw.confidence]),
    description: pickString([raw.description, raw.detail, raw.remark]),
  }
}

/**
 * 规范项目目录文件详情
 * openapi 只声明了 fileName / lineCount / language / sizeBytes，
 * 其余字段（哈希、指纹摘要等）后端未必下发，这里统一给空值兜底避免详情面板报错
 */
export function normalizeKbProjectFileDetail(raw: unknown): KbProjectFileDetail {
  const obj = toRecord(raw)
  const summariesRaw = obj.fingerprintSummaries ?? obj.fingerprint_summaries ?? obj.fingerprints

  return {
    fileName: pickString([obj.fileName, obj.file_name, obj.name]),
    path: pickString([obj.path, obj.filePath, obj.file_path]),
    fileType: pickString([obj.fileType, obj.file_type, obj.language, obj.type]),
    sizeLabel: pickString([obj.sizeLabel, obj.size_label, obj.size, obj.sizeBytes, obj.size_bytes], '—'),
    md5: pickString([obj.md5, obj.md5Hash, obj.md5_hash]),
    sha1: pickString([obj.sha1, obj.sha1Hash, obj.sha1_hash]),
    fingerprintSummary: pickString([obj.fingerprintSummary, obj.fingerprint_summary]),
    licenseClue: pickString([obj.licenseClue, obj.license_clue, obj.license]),
    sourceCandidates: toStringArray(obj.sourceCandidates ?? obj.source_candidates ?? obj.sources),
    updatedAt: pickString([obj.updatedAt, obj.updated_at, obj.lastUpdatedAt, obj.last_updated_at]),
    writeContext: pickString([obj.writeContext, obj.write_context, obj.writeSource, obj.write_source]),
    fingerprintSummaries: Array.isArray(summariesRaw)
      ? summariesRaw.map((item, index) => normalizeFingerprintSummaryRow(toRecord(item), index))
      : [],
  }
}

/** 规范下载类响应（文件元数据导出、漏洞条目导出共用 DownloadResult 结构） */
export function normalizeKnowledgeDownloadResult(
  raw: unknown,
): KbProjectFileMetadataExportResult {
  const obj = toRecord(raw)
  return {
    downloadUrl: pickString([obj.downloadUrl, obj.download_url, obj.url, obj.fileUrl, obj.file_url]),
    fileName: pickString([obj.fileName, obj.file_name, obj.name], 'download'),
  }
}

// ─── 版本管理 ─────────────────────────────────────────────────────────────────

/** 规范版本状态（后端 active 对应前端 ready） */
function normalizeKbVersionStatus(raw: unknown): KbVersionStatus {
  return resolveEnum(raw, KB_VERSION_STATUS_LOOKUP, 'ready')
}

/** 规范版本管理页概览卡片 */
export function normalizeKbVersionOverview(raw: unknown): KbVersionOverview {
  const obj = toRecord(raw)
  return {
    kbProjectId: pickString([obj.kbProjectId, obj.kb_project_id, obj.projectId, obj.project_id, obj.id]),
    projectName: pickString([obj.projectName, obj.project_name, obj.name]),
    currentBaseline: pickString([obj.currentBaseline, obj.current_baseline, obj.baseline, obj.latestVersion], '—'),
    managedVersionCount: pickNumber([obj.managedVersionCount, obj.managed_version_count, obj.versionCount]),
    referencedProjectCount: pickNumber([
      obj.referencedProjectCount,
      obj.referenced_project_count,
      obj.projectCount,
    ]),
    lastFetchedAt: pickString([obj.lastFetchedAt, obj.last_fetched_at, obj.lastFetchAt, obj.updatedAt]),
  }
}

/**
 * 将后端版本对象规范为 KbVersion
 * @param raw - 后端版本对象
 * @param kbProjectId - 路由携带的项目 ID，响应缺 kbProjectId 时兜底
 */
export function normalizeKbVersion(raw: Record<string, unknown>, kbProjectId = ''): KbVersion {
  const indexBuildTraceId = pickString([
    raw.indexBuildTraceId,
    raw.index_build_trace_id,
    raw.traceId,
    raw.trace_id,
  ])
  const updateNotes = pickString([raw.updateNotes, raw.update_notes, raw.notes, raw.releaseNotes])

  const version: KbVersion = {
    versionId: pickString([raw.versionId, raw.version_id, raw.id]),
    kbProjectId: pickString(
      [raw.kbProjectId, raw.kb_project_id, raw.projectId, raw.project_id],
      kbProjectId,
    ),
    versionNo: pickString([raw.versionNo, raw.version_no, raw.version, raw.name]),
    description: pickString([raw.description, raw.summary, raw.remark]),
    referencedProjectCount: pickNumber([
      raw.referencedProjectCount,
      raw.referenced_project_count,
      raw.projectCount,
      raw.project_count,
    ]),
    status: normalizeKbVersionStatus(raw.status),
    createdAt: pickString([raw.createdAt, raw.created_at, raw.indexedAt, raw.indexed_at]),
  }

  if (indexBuildTraceId) version.indexBuildTraceId = indexBuildTraceId
  if (updateNotes) version.updateNotes = updateNotes

  return version
}

/**
 * 规范版本列表分页结果
 * @param raw - 后端分页数据
 * @param kbProjectId - 当前项目 ID，用于回填列表项缺失的 kbProjectId
 */
export function normalizeKbVersionPage(raw: unknown, kbProjectId: string): PageResult<KbVersion> {
  return normalizePageResult(raw, (item) => normalizeKbVersion(item, kbProjectId))
}

/** 规范「获取更新」弹窗结果（包大小 / 预计耗时 / 提示文案） */
export function normalizeFetchKbVersionUpdateResult(raw: unknown): FetchKbVersionUpdateResult {
  const obj = toRecord(raw)
  return {
    packageSizeGb: pickNumber([obj.packageSizeGb, obj.package_size_gb, obj.sizeGb, obj.size_gb]),
    estimatedMinutes: pickNumber([obj.estimatedMinutes, obj.estimated_minutes, obj.etaMinutes]),
    message: pickString([obj.message, obj.tip, obj.description]),
  }
}

/** 规范上传更新包响应（后端异步处理，仅回传解析任务 ID） */
export function normalizeUploadKbVersionPackageResult(
  raw: unknown,
): UploadKbVersionPackageResult {
  const obj = toRecord(raw)
  const parseTaskId = pickString([obj.parseTaskId, obj.parse_task_id, obj.taskId, obj.task_id])
  return parseTaskId ? { parseTaskId } : {}
}

// ─── 覆盖统计 ─────────────────────────────────────────────────────────────────

/** 规范覆盖统计页顶部概览（各覆盖率均为 0–100） */
export function normalizeKnowledgeCoverageOverview(raw: unknown): KnowledgeCoverageOverview {
  const obj = toRecord(raw)
  return {
    projectCoverageRate: pickNumber([obj.projectCoverageRate, obj.project_coverage_rate, obj.coverageRate]),
    directoryIndexRate: pickNumber([obj.directoryIndexRate, obj.directory_index_rate]),
    vulnSourceCoverageRate: pickNumber([obj.vulnSourceCoverageRate, obj.vuln_source_coverage_rate]),
    pendingProjectCount: pickNumber([obj.pendingProjectCount, obj.pending_project_count, obj.pendingCount]),
  }
}

/** 规范分类覆盖统计列表（后端只给 coverageRate 时用作目录覆盖率） */
export function normalizeCategoryCoverageStats(raw: unknown): CategoryCoverageStat[] {
  return normalizeList(raw, (item) => ({
    category: pickString([item.category, item.categoryName, item.category_name, item.name]),
    projectCount: pickNumber([item.projectCount, item.project_count]),
    versionCount: pickNumber([item.versionCount, item.version_count]),
    directoryCoverageRate: pickNumber([
      item.directoryCoverageRate,
      item.directory_coverage_rate,
      item.coverageRate,
      item.coverage_rate,
    ]),
    vulnMappingRate: pickNumber([item.vulnMappingRate, item.vuln_mapping_rate]),
  }))
}

/** 规范采集方式下的分类项目数（堆叠柱状图分段） */
function normalizeCollectionMethodCategoryCounts(raw: unknown): CollectionMethodCategoryCount[] {
  if (Array.isArray(raw)) {
    return raw.map((item) => {
      const obj = toRecord(item)
      return {
        category: pickString([obj.category, obj.name, obj.label]),
        projectCount: pickNumber([obj.projectCount, obj.project_count, obj.count, obj.value]),
      }
    })
  }
  // 后端也可能直接给 { simulation_framework: 8 } 形式的字典
  const obj = toRecord(raw)
  return Object.entries(obj).map(([category, count]) => ({
    category,
    projectCount: pickNumber([count]),
  }))
}

/** 规范采集方式覆盖统计列表 */
export function normalizeCollectionMethodCoverageStats(
  raw: unknown,
): CollectionMethodCoverageStat[] {
  return normalizeList(raw, (item) => ({
    method: ({
      cloud_repo: '云端仓库拉取',
      'repo-pull': '云端仓库拉取',
      upload_package: '上传源码包',
      'upload-source-package': '上传源码包',
    } as Record<string, string>)[pickString([item.method, item.collectMode, item.collect_mode, item.name])]
      ?? pickString([item.method, item.collectMode, item.collect_mode, item.name]),
    projectCount: pickNumber([item.projectCount, item.project_count]),
    categoryCounts: normalizeCollectionMethodCategoryCounts(
      item.categoryCounts ?? item.category_counts ?? item.categories,
    ),
    successRate: pickNumber([item.successRate, item.success_rate, item.percentage]),
    avgDurationMinutes: pickNumber([
      item.avgDurationMinutes,
      item.avg_duration_minutes,
      item.averageDurationMinutes,
    ]),
    durationSampleCount: pickNumber([item.durationSampleCount, item.duration_sample_count]),
  }))
}

/** 规范待补全项影响程度 */
function normalizeCoverageGapImpact(raw: unknown): CoverageGapImpact {
  return resolveEnum(raw, COVERAGE_GAP_IMPACT_LOOKUP, 'medium')
}

/** 规范待补全清单分页结果（后端 missingField 对应前端 gapDescription） */
export function normalizeCoveragePendingPage(raw: unknown): PageResult<CoveragePendingItem> {
  return normalizePageResult(raw, (item) => ({
    pendingId: pickString([item.pendingId, item.pending_id, item.id]),
    projectName: pickString([item.projectName, item.project_name, item.name]),
    gapDescription: pickString([
      item.gapDescription,
      item.gap_description,
      item.missingField,
      item.missing_field,
      item.description,
    ]),
    impact: normalizeCoverageGapImpact(item.impact ?? item.priority ?? item.level),
    suggestedAction: pickString([item.suggestedAction, item.suggested_action, item.suggestion, item.action]),
  }))
}

/** 规范更新趋势周列表 */
export function normalizeCoverageUpdateTrendWeeks(raw: unknown): CoverageUpdateTrendWeek[] {
  return normalizeList(raw, (item) => ({
    weekLabel: pickString([item.weekLabel, item.week_label, item.week, item.label]),
    addedProjectCount: pickNumber([
      item.addedProjectCount,
      item.added_project_count,
      item.updateCount,
      item.update_count,
    ]),
    completedDirectoryCount: pickNumber([item.completedDirectoryCount, item.completed_directory_count]),
    vulnMappingUpdateCount: pickNumber([item.vulnMappingUpdateCount, item.vuln_mapping_update_count]),
    summary: pickString([item.summary, item.description, item.remark]),
  }))
}

// ─── 季度更新 ─────────────────────────────────────────────────────────────────

/** 规范季度更新管理页概览 */
export function normalizeKbQuarterUpdateOverview(raw: unknown): KbQuarterUpdateOverview {
  const obj = toRecord(raw)
  return {
    recentQuarter: pickString([obj.recentQuarter, obj.recent_quarter, obj.latestQuarter, obj.latest_quarter], '—'),
    newProjectCount: pickNumber([obj.newProjectCount, obj.new_project_count]),
    uploadPackageCount: pickNumber([obj.uploadPackageCount, obj.upload_package_count]),
    cloudPullCount: pickNumber([obj.cloudPullCount, obj.cloud_pull_count]),
  }
}

/** 规范季度下拉选项（兼容字符串数组与 { quarter } 对象数组） */
export function normalizeKbQuarterUpdateQuarterOptions(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (item && typeof item === 'object') {
          const obj = toRecord(item)
          return pickString([obj.quarter, obj.value, obj.label, obj.name])
        }
        return String(item ?? '').trim()
      })
      .filter(Boolean)
  }
  return normalizeList(raw, (item) => pickString([item.quarter, item.value, item.label, item.name])).filter(
    Boolean,
  )
}

/** 规范季度更新记录状态 */
function normalizeKbQuarterUpdateStatus(raw: unknown): KbQuarterUpdateStatus {
  return resolveEnum(raw, KB_QUARTER_UPDATE_STATUS_LOOKUP, 'in_progress')
}

/** 规范季度更新记录分页结果（后端 updateType 对应前端 collectMode） */
export function normalizeKbQuarterUpdatePage(raw: unknown): PageResult<KbQuarterUpdateRecord> {
  return normalizePageResult(raw, (item) => ({
    recordId: pickString([item.recordId, item.record_id, item.id]),
    projectName: pickString([item.projectName, item.project_name, item.name]),
    quarter: pickString([item.quarter, item.quarterLabel, item.quarter_label]),
    collectMode: normalizeKbCollectMode(
      item.collectMode ?? item.collect_mode ?? item.updateType ?? item.update_type,
    ),
    status: normalizeKbQuarterUpdateStatus(item.status),
    updatedAt: pickString([item.updatedAt, item.updated_at, item.createdAt, item.created_at]),
  }))
}

// ─── 漏洞知识库 · 概览与来源 ──────────────────────────────────────────────────

/** 规范漏洞知识库页顶部概览 */
export function normalizeVulnKnowledgeOverview(raw: unknown): VulnKnowledgeOverview {
  const obj = toRecord(raw)
  return {
    sourceCount: pickNumber([obj.sourceCount, obj.source_count]),
    totalVulnCount: pickNumber([obj.totalVulnCount, obj.total_vuln_count, obj.total]),
    highRiskCount: pickNumber([obj.highRiskCount, obj.high_risk_count, obj.highCount]),
    lastSyncedAt: pickString([obj.lastSyncedAt, obj.last_synced_at, obj.lastSyncAt, obj.last_sync_at]),
  }
}

/** 规范风险三档数量（兼容 { high, medium, low } 与 [{ level, count }] 两种结构） */
function normalizeVulnRiskLevelCount(raw: unknown): VulnRiskLevelCount {
  if (Array.isArray(raw)) {
    const counts: VulnRiskLevelCount = { high: 0, medium: 0, low: 0 }
    for (const entry of raw) {
      const obj = toRecord(entry)
      const level = resolveEnum(obj.level ?? obj.name ?? obj.key, VULN_ITEM_LEVEL_LOOKUP, 'low')
      counts[level] += pickNumber([obj.count, obj.value, obj.total])
    }
    return counts
  }
  const obj = toRecord(raw)
  return {
    high: pickNumber([obj.high, obj.highCount, obj.high_count]),
    medium: pickNumber([obj.medium, obj.mediumCount, obj.medium_count]),
    low: pickNumber([obj.low, obj.lowCount, obj.low_count]),
  }
}

/** 规范风险摘要中的单个来源维度 */
function normalizeVulnRiskSummarySource(raw: Record<string, unknown>): VulnRiskSummarySource {
  return {
    sourceName: pickString([raw.sourceName, raw.source_name, raw.name]),
    total: pickNumber([raw.total, raw.totalCount, raw.total_count, raw.count]),
    high: pickNumber([raw.high, raw.highCount, raw.high_count]),
    medium: pickNumber([raw.medium, raw.mediumCount, raw.medium_count]),
    low: pickNumber([raw.low, raw.lowCount, raw.low_count]),
    lastSyncedAt: pickString([raw.lastSyncedAt, raw.last_synced_at, raw.lastSyncAt, raw.last_sync_at]),
  }
}

/** 规范漏洞知识库风险摘要图表数据 */
export function normalizeVulnRiskSummary(raw: unknown): VulnRiskSummary {
  const obj = toRecord(raw)
  const sources = normalizeList(obj.sources ?? obj.sourceStats ?? obj.source_stats, (item) =>
    normalizeVulnRiskSummarySource(item),
  )
  const levelCounts = normalizeVulnRiskLevelCount(obj.levelCounts ?? obj.level_counts ?? obj.levels)

  return {
    total: pickNumber([obj.total, obj.totalCount, obj.total_count], levelCounts.high + levelCounts.medium + levelCounts.low),
    highRiskCount: pickNumber([obj.highRiskCount, obj.high_risk_count], levelCounts.high),
    levelCounts,
    sources,
  }
}

/** 规范漏洞来源同步状态（后端 syncing → 前端 delayed，failed/offline → warning） */
function normalizeVulnSyncStatus(raw: unknown): VulnSyncStatus {
  return resolveEnum(raw, VULN_SYNC_STATUS_LOOKUP, 'normal')
}

/** 规范漏洞来源编码；离线包等无法识别的来源返回 null */
function normalizeVulnSourceCode(raw: unknown): VulnSourceCode | null {
  const text = String(raw ?? '').trim()
  if (!text) return null
  return VULN_SOURCE_CODE_LOOKUP[text] ?? VULN_SOURCE_CODE_LOOKUP[toEnumKey(text)] ?? null
}

/** 判定来源种类：后端未下发 kind 时按能否识别内置来源编码推断 */
function normalizeVulnSourceKind(
  raw: Record<string, unknown>,
  sourceCode: VulnSourceCode | null,
): VulnSourceKind {
  const key = toEnumKey(raw.kind ?? raw.sourceKind ?? raw.source_kind ?? raw.type)
  if (key.includes('offline') || key.includes('upload')) return 'offline_upload'
  if (key.includes('builtin') || key.includes('official')) return 'builtin'
  return sourceCode ? 'builtin' : 'offline_upload'
}

/** 将后端漏洞来源对象规范为 VulnSource */
export function normalizeVulnSource(raw: Record<string, unknown>): VulnSource {
  const sourceCode = normalizeVulnSourceCode(
    raw.sourceCode ?? raw.source_code ?? raw.code ?? raw.sourceName ?? raw.source_name,
  )
  const kind = normalizeVulnSourceKind(raw, sourceCode)
  const tags = toStringArray(raw.tags ?? raw.labels)

  return {
    sourceId: pickString([raw.sourceId, raw.source_id, raw.id]),
    kind,
    sourceCode,
    sourceName: pickString([
      raw.sourceName,
      raw.source_name,
      raw.name,
      sourceCode ? VULN_SOURCE_CODE_LABEL[sourceCode] : undefined,
    ]),
    sourceType: pickString(
      [raw.sourceType, raw.source_type, raw.typeName, raw.type_name],
      kind === 'builtin' ? '官方漏洞库' : '上传离线包',
    ),
    description: pickString([raw.description, raw.remark]) || undefined,
    tags: tags.length > 0 ? tags : undefined,
    recordCount: pickNullableNumber([
      raw.recordCount,
      raw.record_count,
      raw.packageCount,
      raw.package_count,
      raw.total,
    ]),
    highRiskCount: pickNullableNumber([
      raw.vulnCount,
      raw.vuln_count,
      raw.highRiskCount,
      raw.high_risk_count,
      raw.highCount,
    ]),
    syncCycle: pickNullableString([raw.syncCycle, raw.sync_cycle, raw.cycle]),
    lastSyncedAt: pickString([
      raw.lastSyncedAt,
      raw.last_synced_at,
      raw.lastSyncAt,
      raw.last_sync_at,
      raw.updatedAt,
      raw.updated_at,
    ]),
    syncStatus: normalizeVulnSyncStatus(raw.syncStatus ?? raw.sync_status ?? raw.status),
  }
}

/** 规范漏洞来源分页结果 */
export function normalizeVulnSourcePage(raw: unknown): PageResult<VulnSource> {
  return normalizePageResult(raw, normalizeVulnSource)
}

/**
 * 前端同步状态筛选值 → 后端枚举
 * 前端只有 normal/delayed/warning 三档，后端为 normal/syncing/failed/offline，
 * warning 这一档在后端对应 failed（offline 暂无法一并筛出，需后端合并口径）
 */
const VULN_SYNC_STATUS_TO_API: Record<VulnSyncStatus, string> = {
  normal: 'normal',
  delayed: 'syncing',
  warning: 'failed',
}

/**
 * 漏洞来源列表查询参数 → 后端 query（同步状态需转换枚举）
 * @param params - 来源名称、同步状态与分页
 */
export function vulnSourceQueryParamsToApi(
  params: VulnSourceQueryParams,
): Record<string, unknown> {
  const { syncStatus, ...rest } = params
  return toKnowledgeQueryParams({
    ...rest,
    syncStatus: syncStatus ? VULN_SYNC_STATUS_TO_API[syncStatus] : undefined,
  })
}

/**
 * 规范「立即同步来源」响应
 * openapi 只声明回传 sourceId 与 syncStatus，其余展示字段用发起同步时的行数据兜底
 * @param raw - 后端响应 data
 * @param submitted - 发起同步时携带的来源 ID / 编码 / 名称
 */
export function normalizeSyncedVulnSource(
  raw: unknown,
  submitted: SyncVulnSourceParams,
): VulnSource {
  return normalizeVulnSource(
    mergeDefinedFields(
      {
        sourceId: submitted.sourceId,
        sourceCode: submitted.sourceCode,
        sourceName: submitted.sourceName,
        kind: 'builtin',
      },
      raw,
    ),
  )
}

/**
 * 规范「导入离线包」响应
 * 后端仅回传 sourceId / sourceName，离线包的记录数等指标以 null 展示为「—」
 * @param raw - 后端响应 data
 * @param sourceTag - 提交的来源标签，响应缺名称时兜底
 */
export function normalizeImportedVulnSource(raw: unknown, sourceTag: string): VulnSource {
  return normalizeVulnSource(
    mergeDefinedFields({ sourceName: sourceTag, kind: 'offline_upload' }, raw),
  )
}

/** 规范全库同步弹窗预览（兼容 sourceNames / sources 两种字段名） */
export function normalizeVulnSyncAllPreview(raw: unknown): VulnSyncAllPreview {
  const obj = toRecord(raw)
  const namesRaw = obj.sourceNames ?? obj.source_names ?? obj.sources
  return {
    sourceNames: toStringArray(namesRaw),
    estimatedMinutes: pickNumber([obj.estimatedMinutes, obj.estimated_minutes, obj.etaMinutes]),
  }
}

// ─── 漏洞条目 ─────────────────────────────────────────────────────────────────

/** 规范漏洞严重等级（critical 归入 high） */
function normalizeVulnItemLevel(raw: unknown): VulnItemLevel {
  return resolveEnum(raw, VULN_ITEM_LEVEL_LOOKUP, 'low')
}

/** 规范漏洞条目处置状态 */
function normalizeVulnItemStatus(raw: unknown): VulnItemStatus {
  return resolveEnum(raw, VULN_ITEM_STATUS_LOOKUP, 'synced')
}

/** 规范快捷检索建议携带的筛选片段（未给出的字段视为清空） */
function normalizeVulnItemQuickSearchFilters(raw: unknown): VulnItemQuickSearchFilters {
  const obj = toRecord(raw)
  const filters: VulnItemQuickSearchFilters = {}

  const keyword = pickString([obj.keyword, obj.q])
  if (keyword) filters.keyword = keyword

  const sourceName = pickString([obj.sourceName, obj.source_name])
  if (sourceName) filters.sourceName = sourceName

  const sourceId = pickString([obj.sourceId, obj.source_id])
  if (sourceId) filters.sourceId = sourceId

  if (pickDefined([obj.level]) !== undefined) {
    filters.level = normalizeVulnItemLevel(obj.level)
  }
  if (pickDefined([obj.status]) !== undefined) {
    filters.status = normalizeVulnItemStatus(obj.status)
  }

  const identifier = pickString([obj.identifier, obj.cveId, obj.cve_id])
  if (identifier) filters.identifier = identifier

  return filters
}

/** 规范漏洞条目页快捷检索建议列表 */
export function normalizeVulnItemQuickSearchSuggestions(
  raw: unknown,
): VulnItemQuickSearchSuggestion[] {
  return normalizeList(raw, (item) => {
    const suggestion: VulnItemQuickSearchSuggestion = {
      suggestionId: pickString([item.suggestionId, item.suggestion_id, item.id, item.keyword]),
      label: pickString([item.label, item.title, item.description, item.keyword]),
      filters: normalizeVulnItemQuickSearchFilters(item.filters ?? item),
    }
    const shortLabel = pickString([item.shortLabel, item.short_label])
    if (shortLabel) suggestion.shortLabel = shortLabel
    return suggestion
  })
}

/** 规范漏洞条目页统计卡片数据 */
export function normalizeVulnItemOverview(raw: unknown): VulnItemOverview {
  const obj = toRecord(raw)
  const overview: VulnItemOverview = {
    totalCount: pickNumber([obj.totalCount, obj.total_count, obj.total]),
    matchedCount: pickNumber([obj.matchedCount, obj.matched_count]),
    highRiskCount: pickNumber([obj.highRiskCount, obj.high_risk_count, obj.highCount, obj.high_count]),
    lastUpdatedAt: pickString([obj.lastUpdatedAt, obj.last_updated_at, obj.updatedAt, obj.updated_at]),
  }

  const duplicateCount = pickDefined([
    obj.crossSourceDuplicateCount,
    obj.cross_source_duplicate_count,
    obj.duplicateCount,
  ])
  if (duplicateCount !== undefined) {
    overview.crossSourceDuplicateCount = pickNumber([duplicateCount])
  }

  const activeSourceName = pickString([obj.activeSourceName, obj.active_source_name, obj.sourceName])
  if (activeSourceName) {
    overview.activeSourceName = activeSourceName
  }

  return overview
}

/** 将后端漏洞条目行规范为 VulnItemListItem（后端 cveId → identifier、severity → level） */
export function normalizeVulnItemListItem(raw: Record<string, unknown>): VulnItemListItem {
  return {
    itemId: pickString([raw.itemId, raw.item_id, raw.id]),
    identifier: pickString([raw.identifier, raw.cveId, raw.cve_id, raw.vulnId, raw.vuln_id]),
    sourceId: pickString([raw.sourceId, raw.source_id]),
    sourceName: pickString([raw.sourceName, raw.source_name]),
    level: normalizeVulnItemLevel(raw.level ?? raw.severity),
    affectedComponent: pickString([
      raw.affectedComponent,
      raw.affected_component,
      raw.component,
      raw.title,
    ]),
    updatedAt: pickString([raw.updatedAt, raw.updated_at, raw.publishedAt, raw.published_at]),
    status: normalizeVulnItemStatus(raw.status),
  }
}

/** 规范漏洞条目分页结果 */
export function normalizeVulnItemPage(raw: unknown): PageResult<VulnItemListItem> {
  return normalizePageResult(raw, normalizeVulnItemListItem)
}

/** 规范 references_json 为可展示的链接与类型，兼容 JSON 字符串、对象和历史字符串数组。 */
function normalizeVulnItemReferenceLinks(raw: unknown): VulnItemReferenceLink[] {
  let source = raw
  if (typeof raw === 'string') {
    try {
      source = JSON.parse(raw)
    } catch {
      source = raw
    }
  }

  if (Array.isArray(source)) {
    return source
      .map((item) => {
        if (typeof item === 'string') return { url: item.trim(), type: '—' }
        const obj = toRecord(item)
        return {
          url: pickString([obj.url, obj.link, obj.href, obj.reference]),
          type: pickString([obj.type, obj.referenceType, obj.reference_type, obj.category], '—'),
        }
      })
      .filter((item) => Boolean(item.url))
  }

  const obj = toRecord(source)
  if (Object.keys(obj).length > 0) {
    const url = pickString([obj.url, obj.link, obj.href, obj.reference])
    return url
      ? [{ url, type: pickString([obj.type, obj.referenceType, obj.reference_type, obj.category], '—') }]
      : []
  }

  return toStringArray(source).map((url) => ({ url, type: '—' }))
}

/** 规范漏洞条目详情 */
export function normalizeVulnItemDetail(raw: unknown, itemId = ''): VulnItemDetail {
  const obj = toRecord(raw)
  return {
    itemId: pickString([obj.itemId, obj.item_id, obj.id], itemId),
    identifier: pickString([obj.identifier, obj.cveId, obj.cve_id]),
    sourceName: pickString([obj.sourceName, obj.source_name]),
    level: normalizeVulnItemLevel(obj.level ?? obj.severity),
    cvssScore: pickNumber([obj.cvssScore, obj.cvss_score, obj.cvss, obj.score]),
    description: pickString([obj.description, obj.detail, obj.summary]),
    affectedComponent: pickString([obj.affectedComponent, obj.affected_component, obj.component, obj.title]),
    fixedVersion: pickString([obj.fixedVersion, obj.fixed_version, obj.patchedVersion], '—'),
    referenceLinks: normalizeVulnItemReferenceLinks(
      obj.referencesJson ?? obj.references_json ?? obj.referenceLinks ?? obj.reference_links ?? obj.references,
    ),
  }
}

/**
 * 漏洞条目导出 · POST 请求体（空筛选项不下发）
 * @param params - 筛选条件、导出格式与范围
 */
export function vulnItemExportParamsToApi(params: VulnItemExportParams): Record<string, unknown> {
  return toKnowledgeQueryParams({ ...params })
}
