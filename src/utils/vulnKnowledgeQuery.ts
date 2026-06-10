import type {
  VulnSourceListFilters,
  VulnSourceQueryParams,
  VulnSyncStatus,
} from '@/types/knowledge'
import { VULN_SYNC_STATUS_LABEL } from '@/utils/vulnKnowledgeDisplay'

/** 同步状态筛选项 */
export const VULN_SYNC_STATUS_FILTER_OPTIONS: {
  value: VulnSyncStatus | ''
  label: string
}[] = [
  { value: '', label: '全部状态' },
  ...(Object.entries(VULN_SYNC_STATUS_LABEL) as [VulnSyncStatus, string][]).map(
    ([value, label]) => ({ value, label }),
  ),
]

/** 返回空的漏洞来源列表筛选表单 */
export function createEmptyVulnSourceListFilters(): VulnSourceListFilters {
  return {
    sourceName: '',
    syncStatus: '',
    keyword: '',
  }
}

/** 将表单筛选条件转为 API 查询参数（空值不传） */
export function vulnSourceListFiltersToQuery(
  filters: VulnSourceListFilters,
): Omit<VulnSourceQueryParams, 'page' | 'pageSize'> {
  const query: Omit<VulnSourceQueryParams, 'page' | 'pageSize'> = {}
  const sourceName = filters.sourceName.trim()
  const keyword = filters.keyword.trim()

  if (sourceName) query.sourceName = sourceName
  if (filters.syncStatus) query.syncStatus = filters.syncStatus
  if (keyword) query.keyword = keyword

  return query
}
