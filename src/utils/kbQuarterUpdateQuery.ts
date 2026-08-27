import type {
  KbCollectMode,
  KbQuarterUpdateListFilters,
  KbQuarterUpdateListQueryParams,
  KbQuarterUpdateStatus,
} from '@/types/knowledge'

/** 状态筛选项（默认「全部状态」） */
export const KB_QUARTER_UPDATE_STATUS_FILTER_OPTIONS: {
  value: KbQuarterUpdateStatus | ''
  label: string
}[] = [
  { value: '', label: '全部状态' },
  { value: 'in_progress', label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'failed', label: '失败' },
]

/** 采集方式筛选项（默认「全部方式」） */
export const KB_QUARTER_UPDATE_COLLECT_MODE_FILTER_OPTIONS: {
  value: KbCollectMode | ''
  label: string
}[] = [
  { value: '', label: '全部方式' },
  { value: 'cloud_repo', label: '云端拉取' },
  { value: 'upload_package', label: '上传包' },
]

/** 返回空的季度更新记录筛选表单 */
export function createEmptyKbQuarterUpdateListFilters(): KbQuarterUpdateListFilters {
  return {
    quarter: '',
    status: '',
    collectMode: '',
  }
}

/** 将筛选表单转为 API 查询参数（空值不传） */
export function kbQuarterUpdateListFiltersToQuery(
  filters: KbQuarterUpdateListFilters,
): Omit<KbQuarterUpdateListQueryParams, 'page' | 'pageSize'> {
  const query: Omit<KbQuarterUpdateListQueryParams, 'page' | 'pageSize'> = {}

  if (filters.quarter) query.quarter = filters.quarter
  if (filters.status) query.status = filters.status
  if (filters.collectMode) query.collectMode = filters.collectMode

  return query
}
