import { onMounted, reactive, ref, type Ref } from 'vue'
import type { TablePaginationConfig } from 'ant-design-vue'
import type { PageParams, PageResult } from '@/types/common'

export interface UsePaginatedListOptions {
  /** 每页条数，默认 10 */
  pageSize?: number
  /** 是否在挂载时立即请求第一页 */
  immediate?: boolean
  /** 分页器 total 文案 */
  showTotal?: (total: number) => string
}

/**
 * 分页懒加载：每次只请求当前页数据，切换页码时重新调用 fetchFn。
 *
 * @param fetchFn 分页请求函数，返回 PageResult（页面内通常包装 api 并取 res.data）
 * @param options 分页配置
 *
 * @example
 * const { loading, list, pagination, loadPage } = usePaginatedList(
 *   async (params) => (await getTaskList(params)).data,
 *   { pageSize: 10 },
 * )
 */
export function usePaginatedList<T>(
  fetchFn: (params: PageParams) => Promise<PageResult<T>>,
  options: UsePaginatedListOptions = {},
) {
  const {
    pageSize = 10,
    immediate = true,
    showTotal = (total) => `共 ${total} 条`,
  } = options

  const loading = ref(false)
  const list = ref<T[]>([]) as Ref<T[]>

  const pagination = reactive<TablePaginationConfig>({
    current: 1,
    pageSize,
    total: 0,
    showSizeChanger: false,
    showTotal,
    onChange: (page) => {
      pagination.current = page
      loadPage()
    },
  })

  /** 按当前 pagination 页码请求一页数据 */
  async function loadPage() {
    loading.value = true
    try {
      const result = await fetchFn({
        page: pagination.current ?? 1,
        pageSize: pagination.pageSize ?? pageSize,
      })
      list.value = result.list
      pagination.total = result.total
      pagination.current = result.page
      pagination.pageSize = result.pageSize
    } finally {
      loading.value = false
    }
  }

  /** 重置到第一页并刷新 */
  async function refresh() {
    pagination.current = 1
    await loadPage()
  }

  if (immediate) {
    onMounted(loadPage)
  }

  return {
    loading,
    list,
    pagination,
    loadPage,
    refresh,
  }
}
