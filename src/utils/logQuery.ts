import type { LogExportFormat, LogListFilters, LogQueryParams } from '@/types/system'
import { LOG_RESULT_LABEL } from '@/utils/logDisplay'
import dayjs from 'dayjs'

/** 结果筛选项 */
export const LOG_RESULT_FILTER_OPTIONS: {
  value: LogListFilters['result']
  label: string
}[] = [
  { value: '', label: '全部结果' },
  { value: 'success', label: LOG_RESULT_LABEL.success },
  { value: 'failure', label: LOG_RESULT_LABEL.failure },
]

/** 导出格式选项 */
export const LOG_EXPORT_FORMAT_OPTIONS: {
  value: LogExportFormat
  label: string
}[] = [
  { value: 'csv', label: 'CSV' },
  { value: 'json', label: 'JSON' },
]

/** 返回空的日志列表筛选表单 */
export function createEmptyLogListFilters(): LogListFilters {
  return {
    traceId: '',
    occurredAtRange: null,
    username: '',
    module: '',
    result: '',
  }
}

/** 导出弹窗默认时间范围：近 7 天 */
export function createDefaultLogExportRange(): [dayjs.Dayjs, dayjs.Dayjs] {
  return [dayjs().subtract(7, 'day').startOf('day'), dayjs().endOf('day')]
}

/** 将表单筛选条件转为 API 查询参数（空值不传） */
export function logListFiltersToQuery(
  filters: LogListFilters,
): Omit<LogQueryParams, 'page' | 'pageSize'> {
  const query: Omit<LogQueryParams, 'page' | 'pageSize'> = {}
  const traceId = filters.traceId.trim()
  const username = filters.username.trim()
  const moduleName = filters.module.trim()

  if (traceId) query.traceId = traceId
  if (username) query.username = username
  if (moduleName) query.module = moduleName
  if (filters.result) query.result = filters.result

  if (filters.occurredAtRange) {
    query.occurredAtStart = filters.occurredAtRange[0].format('YYYY-MM-DD HH:mm:ss')
    query.occurredAtEnd = filters.occurredAtRange[1].format('YYYY-MM-DD HH:mm:ss')
  }

  return query
}
