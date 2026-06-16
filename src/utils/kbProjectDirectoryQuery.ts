import type {
  KbProjectDirectoryFilters,
  KbProjectDirectoryQueryParams,
} from '@/types/knowledge'

/** 返回空的项目目录筛选表单 */
export function createEmptyKbProjectDirectoryFilters(versionId = ''): KbProjectDirectoryFilters {
  return {
    versionId,
    keyword: '',
  }
}

/**
 * 将项目目录筛选表单转为 API 查询参数（空值不传）
 * @param filters - 版本与关键字筛选
 * @param kbProjectId - 当前路由中的知识库项目 ID
 */
export function kbProjectDirectoryFiltersToQuery(
  filters: KbProjectDirectoryFilters,
  kbProjectId: string,
): KbProjectDirectoryQueryParams {
  const query: KbProjectDirectoryQueryParams = {
    kbProjectId,
  }
  const keyword = filters.keyword.trim()

  if (filters.versionId) {
    query.versionId = filters.versionId
  }
  if (keyword) {
    query.keyword = keyword
  }

  return query
}
