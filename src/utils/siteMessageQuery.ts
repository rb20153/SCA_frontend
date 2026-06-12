import type { SiteMessageListFilters } from '@/types/siteMessage'

/** 创建空的站内消息筛选表单 */
export function createEmptySiteMessageListFilters(): SiteMessageListFilters {
  return {
    type: '',
    title: '',
    readStatus: 'all',
  }
}

/**
 * 将筛选表单转为 API 查询参数（空 type / title 不传递）
 * @param filters - 查询区表单值
 */
export function siteMessageListFiltersToQuery(
  filters: SiteMessageListFilters,
): Record<string, unknown> {
  const query: Record<string, unknown> = {
    readStatus: filters.readStatus,
  }
  if (filters.type) {
    query.type = filters.type
  }
  const title = filters.title.trim()
  if (title) {
    query.title = title
  }
  return query
}
