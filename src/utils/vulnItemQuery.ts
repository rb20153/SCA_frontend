import type {
  VulnItemExportFormat,
  VulnItemExportScope,
  VulnItemLevel,
  VulnItemListFilters,
  VulnItemListQueryParams,
  VulnItemQuickSearchSuggestion,
  VulnItemStatus,
} from '@/types/knowledge'
import {
  VULN_ITEM_LEVEL_LABEL,
  VULN_ITEM_STATUS_LABEL,
} from '@/utils/vulnItemDisplay'

const QUICK_SEARCH_TAG_LABEL_MAX = 28

/** 等级筛选项 */
export const VULN_ITEM_LEVEL_FILTER_OPTIONS: {
  value: VulnItemLevel | ''
  label: string
}[] = [
  { value: '', label: '全部等级' },
  ...(Object.entries(VULN_ITEM_LEVEL_LABEL) as [VulnItemLevel, string][]).map(
    ([value, label]) => ({ value, label }),
  ),
]

/** 导出格式选项 */
export const VULN_ITEM_EXPORT_FORMAT_OPTIONS: {
  value: VulnItemExportFormat
  label: string
}[] = [
  { value: 'csv', label: 'CSV' },
  { value: 'excel', label: 'Excel' },
  { value: 'json', label: 'JSON' },
]

/** 导出范围选项 */
export const VULN_ITEM_EXPORT_SCOPE_OPTIONS: {
  value: VulnItemExportScope
  label: string
}[] = [
  { value: 'filtered', label: '当前筛选结果' },
  { value: 'current_page', label: '当前页' },
]

/** 状态筛选项（顺序与原型一致） */
export const VULN_ITEM_STATUS_FILTER_OPTIONS: {
  value: VulnItemStatus | ''
  label: string
}[] = [
  { value: '', label: '全部状态' },
  { value: 'pending_action', label: VULN_ITEM_STATUS_LABEL.pending_action },
  { value: 'needs_review', label: VULN_ITEM_STATUS_LABEL.needs_review },
  { value: 'synced', label: VULN_ITEM_STATUS_LABEL.synced },
]

/** 返回空的漏洞条目列表筛选表单 */
export function createEmptyVulnItemListFilters(): VulnItemListFilters {
  return {
    keyword: '',
    sourceName: '',
    sourceId: '',
    level: '',
    status: '',
    identifier: '',
  }
}

/** 将表单筛选条件转为 API 查询参数（空值不传） */
export function vulnItemListFiltersToQuery(
  filters: VulnItemListFilters,
): Omit<VulnItemListQueryParams, 'page' | 'pageSize'> {
  const query: Omit<VulnItemListQueryParams, 'page' | 'pageSize'> = {}
  const keyword = filters.keyword.trim()
  const sourceName = filters.sourceName.trim()
  const identifier = filters.identifier.trim()

  if (keyword) query.keyword = keyword
  if (filters.sourceId) {
    query.sourceId = filters.sourceId
  } else if (sourceName) {
    query.sourceName = sourceName
  }
  if (filters.level) query.level = filters.level
  if (filters.status) query.status = filters.status
  if (identifier) query.identifier = identifier

  return query
}

/**
 * 生成快捷检索标签上的短文案（优先 shortLabel，否则从 filters 拼接）
 * @param suggestion - 后端下发的建议项
 */
export function formatQuickSearchTagLabel(suggestion: VulnItemQuickSearchSuggestion): string {
  if (suggestion.shortLabel?.trim()) {
    return suggestion.shortLabel.trim()
  }

  const { filters } = suggestion
  const parts: string[] = []

  if (filters.sourceName?.trim()) {
    parts.push(filters.sourceName.trim())
  }
  if (filters.identifier?.trim()) {
    parts.push(filters.identifier.trim())
  } else if (filters.keyword?.trim()) {
    parts.push(filters.keyword.trim())
  }
  if (filters.level) {
    parts.push(VULN_ITEM_LEVEL_LABEL[filters.level])
  }
  if (filters.status) {
    parts.push(VULN_ITEM_STATUS_LABEL[filters.status])
  }

  if (parts.length > 0) {
    return parts.join(' · ')
  }

  const label = suggestion.label.trim()
  if (label.length <= QUICK_SEARCH_TAG_LABEL_MAX) {
    return label
  }

  return `${label.slice(0, QUICK_SEARCH_TAG_LABEL_MAX)}…`
}

/**
 * 将快捷检索建议转为完整筛选表单（未指定字段重置为空）
 * @param suggestion - 后端下发的建议项
 */
export function quickSearchSuggestionToFilters(
  suggestion: VulnItemQuickSearchSuggestion,
): VulnItemListFilters {
  const empty = createEmptyVulnItemListFilters()
  const { filters } = suggestion

  return {
    ...empty,
    keyword: filters.keyword ?? '',
    sourceName: filters.sourceName ?? '',
    sourceId: filters.sourceId ?? '',
    level: filters.level ?? '',
    status: filters.status ?? '',
    identifier: filters.identifier ?? '',
  }
}
