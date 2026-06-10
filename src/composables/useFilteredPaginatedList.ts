import { reactive, ref } from 'vue'
import type { PageParams, PageResult } from '@/types/common'
import { usePaginatedList, type UsePaginatedListOptions } from '@/composables/usePaginatedList'

export interface UseFilteredPaginatedListOptions<TFilters>
  extends Omit<UsePaginatedListOptions, 'immediate'> {
  /** 空筛选表单工厂 */
  createEmptyFilters: () => TFilters
  /** 将表单值转为 API 查询参数（空值字段由业务方决定是否剔除） */
  filtersToQuery: (filters: TFilters) => Record<string, unknown>
  /** 是否在挂载时立即请求第一页，默认 true */
  immediate?: boolean
}

/**
 * 带筛选 + 分页的列表数据流：
 * - filterForm：查询区表单（可双向绑定到 QueryBar）
 * - appliedQuery：点击「查询」后生效的条件；翻页时一并携带
 * - handleSearch / handleReset：查询与重置（回到第 1 页并请求）
 *
 * @example
 * const { filterForm, loading, list, pagination, handleSearch, handleReset } =
 *   useFilteredPaginatedList(
 *     async (params) => (await getTaskList(params)).data,
 *     {
 *       createEmptyFilters: createEmptyTaskListFilters,
 *       filtersToQuery: taskListFiltersToQuery,
 *       pageSize: 10,
 *     },
 *   )
 */
export function useFilteredPaginatedList<TItem, TFilters extends object>(
  fetchFn: (params: PageParams & Record<string, unknown>) => Promise<PageResult<TItem>>,
  options: UseFilteredPaginatedListOptions<TFilters>,
) {
  const {
    createEmptyFilters,
    filtersToQuery,
    immediate = true,
    ...paginationOptions
  } = options

  const filterForm = reactive(createEmptyFilters()) as TFilters
  const appliedQuery = ref<Record<string, unknown>>({})

  const { loading, list, pagination, loadPage, refresh } = usePaginatedList<TItem>(
    (pageParams) =>
      fetchFn({
        ...appliedQuery.value,
        ...pageParams,
      }),
    { ...paginationOptions, immediate: false },
  )

  async function handleSearch() {
    appliedQuery.value = filtersToQuery(filterForm)
    pagination.current = 1
    await loadPage()
  }

  async function handleReset() {
    Object.assign(filterForm, createEmptyFilters())
    appliedQuery.value = {}
    pagination.current = 1
    await loadPage()
  }

  if (immediate) {
    loadPage()
  }

  return {
    filterForm,
    appliedQuery,
    loading,
    list,
    pagination,
    loadPage,
    refresh,
    handleSearch,
    handleReset,
  }
}
