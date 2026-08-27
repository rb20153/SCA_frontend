import type {
  AlertLevel,
  AlertListFilters,
  AlertQueryParams,
  AlertReadFilter,
} from '@/types/system'
import { ALERT_LEVEL_LABEL } from '@/utils/alertDisplay'

/** 级别筛选项 */
export const ALERT_LEVEL_FILTER_OPTIONS: {
  value: AlertLevel | ''
  label: string
}[] = [
  { value: '', label: '全部级别' },
  { value: 'critical', label: ALERT_LEVEL_LABEL.critical },
  { value: 'important', label: ALERT_LEVEL_LABEL.important },
  { value: 'normal', label: ALERT_LEVEL_LABEL.normal },
]

/** 未处理 Tab 已读状态筛选项 */
export const ALERT_READ_FILTER_OPTIONS: { value: AlertReadFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'unread', label: '未读' },
  { value: 'read', label: '已读' },
]

/** 返回空的告警列表筛选表单；默认不限制日期，避免隐藏跨时区告警。 */
export function createEmptyAlertListFilters(): AlertListFilters {
  return {
    level: '',
    readStatus: 'all',
    occurredAt: undefined,
  }
}

/** 将表单筛选条件转为 API 查询参数 */
export function alertListFiltersToQuery(
  filters: AlertListFilters,
): Omit<AlertQueryParams, 'page' | 'pageSize' | 'status'> {
  const query: Omit<AlertQueryParams, 'page' | 'pageSize' | 'status'> = {}

  if (filters.level) {
    query.level = filters.level
  }
  if (filters.readStatus && filters.readStatus !== 'all') {
    query.readStatus = filters.readStatus
  }
  if (filters.occurredAt) {
    query.occurredDate = filters.occurredAt.format('YYYY-MM-DD')
  }

  return query
}
