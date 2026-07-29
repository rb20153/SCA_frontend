import type { PageNavTabItem } from '@/types/common'
import type {
  AutonomyCodeAlertType,
  AutonomyFingerprintAlertType,
  AutonomyDetectResultTabKey,
  AutonomySourceHitItem,
  AutonomySourceHitListFilters,
  AutonomySourceHitQueryParams,
  AutonomySourceHitRiskLevel,
} from '@/types/detect'

/** 代码检测告警类型 Tag 颜色 */
export const AUTONOMY_CODE_ALERT_TYPE_COLOR: Record<AutonomyCodeAlertType, string> = {
  'high-similarity': 'error',
  'fragment-reassembly': 'warning',
}

/** 代码检测告警类型展示文案 */
export const AUTONOMY_CODE_ALERT_TYPE_LABEL: Record<AutonomyCodeAlertType, string> = {
  'high-similarity': '高相似',
  'fragment-reassembly': '片段重组',
}

/** 指纹检测告警类型 Tag 颜色 */
export const AUTONOMY_FINGERPRINT_ALERT_TYPE_COLOR: Record<AutonomyFingerprintAlertType, string> = {
  'fingerprint-hit': 'blue',
  'fingerprint-sequence': 'cyan',
  'segment-fingerprint': 'geekblue',
}

/** 指纹检测告警类型展示文案 */
export const AUTONOMY_FINGERPRINT_ALERT_TYPE_LABEL: Record<AutonomyFingerprintAlertType, string> = {
  'fingerprint-hit': '指纹命中',
  'fingerprint-sequence': '函数级指纹',
  'segment-fingerprint': '片段指纹',
}

/** 自主率检测结果页 Tab 配置 */
export const AUTONOMY_DETECT_RESULT_TABS: PageNavTabItem[] = [
  { key: 'evidence', label: '文件证据' },
  { key: 'sources', label: '来源汇总' },
]

/** 来源汇总 · 风险等级筛选项 */
export const AUTONOMY_SOURCE_HIT_LEVEL_FILTER_OPTIONS: {
  value: AutonomySourceHitRiskLevel | ''
  label: string
}[] = [
  { value: '', label: '全部等级' },
  { value: 'high', label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low', label: '低' },
]

/** 来源汇总 · 风险等级 Tag 颜色 */
export const AUTONOMY_SOURCE_HIT_LEVEL_COLOR: Record<AutonomySourceHitRiskLevel, string> = {
  high: 'error',
  medium: 'warning',
  low: 'success',
}

/** 来源汇总 · 风险等级展示文案 */
export const AUTONOMY_SOURCE_HIT_LEVEL_LABEL: Record<AutonomySourceHitRiskLevel, string> = {
  high: '高',
  medium: '中',
  low: '低',
}

/** 来源汇总表格横向滚动宽度 */
export const AUTONOMY_SOURCE_HIT_TABLE_SCROLL_X = 960

/** 创建空的来源汇总筛选表单 */
export function createEmptyAutonomySourceHitListFilters(): AutonomySourceHitListFilters {
  return {
    kbProjectName: '',
    riskLevel: '',
  }
}

/**
 * 将来源汇总筛选表单转为 API 查询参数
 * @param filters - 页面筛选表单
 */
export function autonomySourceHitListFiltersToQuery(
  filters: AutonomySourceHitListFilters,
): AutonomySourceHitQueryParams {
  const kbProjectName = filters.kbProjectName.trim()
  return {
    ...(kbProjectName ? { kbProjectName } : {}),
    ...(filters.riskLevel ? { riskLevel: filters.riskLevel } : {}),
  }
}

/** 来源汇总「命中文件」列展示：优先 filePath，否则拼接 hitFileNames */
export function formatAutonomySourceHitFileDisplay(
  item: AutonomySourceHitItem | Record<string, unknown>,
): string {
  const raw = item as Record<string, unknown>
  const path = String(raw.filePath ?? raw.file_path ?? raw.path ?? '').trim()
  if (path) {
    return path
  }
  const namesRaw = raw.hitFileNames ?? raw.hit_file_names ?? raw.files
  const names = Array.isArray(namesRaw) ? namesRaw.map((n) => String(n)) : []
  return formatAutonomySourceHitFiles(names)
}

/** 命中文件名称列表转为表格展示文案 */
export function formatAutonomySourceHitFiles(fileNames: string[]): string {
  return fileNames.join(' / ')
}
