<template>
  <div class="page-container">
    <div class="page-toolbar">
      <a-button @click="exportVisible = true">导出当前检索结果</a-button>
      <VulnItemQuickSearchCard
        :suggestions="quickSearchSuggestions"
        :loading="quickSearchLoading"
        @select="handleQuickSearch"
      />
    </div>

    <VulnItemQueryBar
      v-model="filterForm"
      @search="onSearch"
      @reset="onReset"
    />

    <PageLoading :loading="overviewLoading && statCards.length === 0">
      <StatCardRow v-if="statCards.length > 0" :items="statCards" />
    </PageLoading>

    <a-card :bordered="false" class="table-card">
      <PageLoading :loading="loading && itemList.length === 0">
        <ListEmptyGuide
          v-if="!loading && itemList.length === 0"
          title="暂无漏洞条目"
          description="当前筛选条件下没有匹配的漏洞条目"
        />
        <VulnItemTable
          v-else
          :items="itemList"
          :loading="loading"
          :pagination="pagination"
          @detail="openDetailDrawer"
        />
      </PageLoading>
    </a-card>

    <VulnItemDetailDrawer
      v-model:open="detailVisible"
      :item-id="viewingItemId"
    />

    <VulnItemExportModal
      v-model:open="exportVisible"
      :export-query="(appliedQuery as VulnItemOverviewQueryParams)"
      :current-page="pagination.current ?? 1"
      :page-size="pagination.pageSize ?? 10"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getVulnItemOverview,
  getVulnItemList,
  getVulnItemQuickSearchSuggestions,
} from '@/api/knowledge'
import ListEmptyGuide from '@/components/common/ListEmptyGuide.vue'
import PageLoading from '@/components/common/PageLoading.vue'
import StatCardRow from '@/components/common/StatCardRow.vue'
import VulnItemDetailDrawer from '@/components/knowledge/VulnItemDetailDrawer.vue'
import VulnItemExportModal from '@/components/knowledge/VulnItemExportModal.vue'
import VulnItemQuickSearchCard from '@/components/knowledge/VulnItemQuickSearchCard.vue'
import VulnItemQueryBar from '@/components/knowledge/VulnItemQueryBar.vue'
import VulnItemTable from '@/components/knowledge/VulnItemTable.vue'
import { useFilteredPaginatedList } from '@/composables/useFilteredPaginatedList'
import type { StatCardItem } from '@/types/common'
import type {
  VulnItemListItem,
  VulnItemOverviewQueryParams,
  VulnItemQuickSearchSuggestion,
} from '@/types/knowledge'
import { mapVulnItemToStatCards } from '@/utils/statCard'
import {
  createEmptyVulnItemListFilters,
  quickSearchSuggestionToFilters,
  vulnItemListFiltersToQuery,
} from '@/utils/vulnItemQuery'

const route = useRoute()
const router = useRouter()

const overviewLoading = ref(false)
const statCards = ref<StatCardItem[]>([])
const detailVisible = ref(false)
const viewingItemId = ref<string | null>(null)
const exportVisible = ref(false)
const quickSearchLoading = ref(false)
const quickSearchSuggestions = ref<VulnItemQuickSearchSuggestion[]>([])

const {
  filterForm,
  appliedQuery,
  loading,
  list: itemList,
  pagination,
  handleSearch,
  handleReset,
} = useFilteredPaginatedList<VulnItemListItem, ReturnType<typeof createEmptyVulnItemListFilters>>(
  async (params) => (await getVulnItemList(params)).data,
  {
    createEmptyFilters: createEmptyVulnItemListFilters,
    filtersToQuery: vulnItemListFiltersToQuery,
    pageSize: 10,
    immediate: false,
  },
)

/** 从路由 query 解析来源 ID（来源列表跳转携带） */
function getRouteSourceId(): string | undefined {
  const sourceId = route.query.sourceId
  return typeof sourceId === 'string' && sourceId.length > 0 ? sourceId : undefined
}

/** 拉取后端下发的快捷检索建议 */
async function fetchQuickSearchSuggestions() {
  quickSearchLoading.value = true
  try {
    const res = await getVulnItemQuickSearchSuggestions()
    quickSearchSuggestions.value = res.data
  } finally {
    quickSearchLoading.value = false
  }
}

/** 按当前已生效筛选条件拉取统计卡片 */
async function fetchOverview() {
  overviewLoading.value = true
  try {
    const res = await getVulnItemOverview(appliedQuery.value as VulnItemOverviewQueryParams)
    statCards.value = mapVulnItemToStatCards(res.data)
  } finally {
    overviewLoading.value = false
  }
}

/** 从来源列表带 sourceId 进入时，自动填充来源筛选项 */
async function applyRouteSourceFilter() {
  const sourceId = getRouteSourceId()
  if (!sourceId) return

  filterForm.value.sourceId = sourceId
  const res = await getVulnItemOverview({ sourceId })
  if (res.data.activeSourceName) {
    filterForm.value.sourceName = res.data.activeSourceName
  }
}

/** 查询：列表与统计卡片并行刷新 */
async function onSearch() {
  await handleSearch()
  await fetchOverview()
}

/** 重置筛选；若来自来源列表跳转则清除 URL 中的 sourceId（由路由 watch 触发刷新） */
async function onReset() {
  const hadRouteSource = Boolean(getRouteSourceId())
  await handleReset()
  if (hadRouteSource) {
    await router.replace({ query: {} })
    return
  }
  await fetchOverview()
}

/** 点击快捷建议：写入筛选表单并自动查询 */
async function handleQuickSearch(suggestion: VulnItemQuickSearchSuggestion) {
  Object.assign(filterForm.value, quickSearchSuggestionToFilters(suggestion))

  if (getRouteSourceId()) {
    await router.replace({ query: {} })
  }

  await onSearch()
}

/** 打开条目详情抽屉 */
function openDetailDrawer(item: VulnItemListItem) {
  viewingItemId.value = item.itemId
  detailVisible.value = true
}

/** 带 sourceId 的路由变化时同步来源筛选并查询 */
watch(
  () => route.query.sourceId,
  async (sourceId) => {
    if (typeof sourceId !== 'string' || !sourceId) return
    await applyRouteSourceFilter()
    await onSearch()
  },
)

onMounted(async () => {
  await fetchQuickSearchSuggestions()
  if (getRouteSourceId()) {
    await applyRouteSourceFilter()
  }
  await onSearch()
})
</script>

<style scoped>
.page-container {
  min-height: 100%;
}

.page-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 24px;
  margin-bottom: 16px;
}

.table-card {
  margin-top: 16px;
}
</style>
