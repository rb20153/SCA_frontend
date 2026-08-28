import type { SourceIngestMode } from '@/types/sourceIngest'
import type {
  AiParseFallbackReason,
  AiParseScanDepth,
  AiParseTaskListFilters,
  AiParseTaskQueryParams,
  AiParseTaskStatus,
} from '@/types/detect'

/** AI 解析 · 来源筛选项（页面文案） */
export const AI_PARSE_SOURCE_FILTER_OPTIONS: {
  value: SourceIngestMode | ''
  label: string
}[] = [
  { value: '', label: '全部来源' },
  { value: 'repo-pull', label: '三方仓库拉取' },
  { value: 'upload-source-package', label: '上传压缩包' },
]

/** AI 解析 · 来源展示文案 */
export const AI_PARSE_SOURCE_LABEL: Record<SourceIngestMode, string> = {
  'repo-pull': '三方仓库拉取',
  'upload-source-package': '上传压缩包',
}

/** AI 解析 · 状态筛选项 */
export const AI_PARSE_STATUS_FILTER_OPTIONS: {
  value: AiParseTaskStatus | ''
  label: string
}[] = [
  { value: '', label: '全部状态' },
  { value: 'running', label: '进行中' },
  { value: 'failed', label: '失败' },
  { value: 'success', label: '已完成' },
]

/** AI 解析 · 状态 Tag 配色 */
export const AI_PARSE_STATUS_COLOR: Record<AiParseTaskStatus, string> = {
  running: 'processing',
  failed: 'error',
  success: 'success',
}

/** AI 解析 · 状态中文 */
export const AI_PARSE_STATUS_LABEL: Record<AiParseTaskStatus, string> = {
  running: '进行中',
  failed: '失败',
  success: '已完成',
}

/** AI 解析 · 扫描深度选项 */
export const AI_PARSE_SCAN_DEPTH_OPTIONS: { value: AiParseScanDepth; label: string }[] = [
  { value: 1, label: '1 层依赖' },
  { value: 2, label: '2 层依赖' },
  { value: 3, label: '3 层依赖' },
]

/** AI 解析 · 规则回退原因选项 */
export const AI_PARSE_FALLBACK_REASON_OPTIONS: {
  value: AiParseFallbackReason
  label: string
}[] = [
  { value: 'incomplete-license', label: '压缩包内部 LICENSE 不完整' },
  { value: 'ai-unavailable', label: 'AI 服务不可用' },
  { value: 'low-confidence', label: '低置信度，需规则兜底' },
]

/** AI 解析列表表格横向滚动宽度 */
export const AI_PARSE_TASK_TABLE_SCROLL_X = 1152

/** 返回空的 AI 解析列表筛选表单 */
export function createEmptyAiParseTaskListFilters(): AiParseTaskListFilters {
  return {
    sourceMode: '',
    status: '',
  }
}

/** 将筛选表单转为 API 查询参数 */
export function aiParseTaskListFiltersToQuery(
  filters: AiParseTaskListFilters,
): Omit<AiParseTaskQueryParams, 'page' | 'pageSize'> {
  const query: Omit<AiParseTaskQueryParams, 'page' | 'pageSize'> = {}
  if (filters.sourceMode) {
    query.sourceMode = filters.sourceMode
  }
  if (filters.status) {
    query.status = filters.status
  }
  return query
}

/** 扫描深度展示文案 */
export function formatAiParseScanDepth(depth: AiParseScanDepth): string {
  return `${depth} 层依赖`
}
