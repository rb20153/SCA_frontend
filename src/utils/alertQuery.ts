import type { AlertLevel, AlertListFilters, AlertQueryParams } from '@/types/system'
import { ALERT_LEVEL_LABEL } from '@/utils/alertDisplay'
import dayjs from 'dayjs'

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

/** 返回空的告警列表筛选表单，时间默认今日 00:00 */
export function createEmptyAlertListFilters(): AlertListFilters {
  return {
    level: '',
    occurredAt: dayjs().startOf('day'),
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
  if (filters.occurredAt) {
    query.occurredDate = filters.occurredAt.format('YYYY-MM-DD')
  }

  return query
}
