<template>
  <div class="autonomy-source-hit-panel">
    <AutonomySourceHitQueryBar
      v-model="filterForm"
      @search="handleSearch"
      @reset="handleReset"
    />

    <a-card :bordered="false" class="table-card">
      <PageLoading :loading="loading && items.length === 0">
        <ListEmptyGuide
          v-if="!loading && items.length === 0"
          title="暂无来源汇总"
          description="当前筛选条件下没有匹配的知识库来源记录"
        />
        <AutonomySourceHitTable
          v-else
          :items="items"
          :loading="loading"
          :pagination="pagination"
          @locate="emit('locate', $event)"
        />
      </PageLoading>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { getAutonomyDetectSourceHitList } from '@/api/detect'
import AutonomySourceHitQueryBar from '@/components/detect/AutonomySourceHitQueryBar.vue'
import AutonomySourceHitTable from '@/components/detect/AutonomySourceHitTable.vue'
import ListEmptyGuide from '@/components/common/ListEmptyGuide.vue'
import PageLoading from '@/components/common/PageLoading.vue'
import { useFilteredPaginatedList } from '@/composables/useFilteredPaginatedList'
import type { AutonomySourceHitItem } from '@/types/detect'
import {
  autonomySourceHitListFiltersToQuery,
  createEmptyAutonomySourceHitListFilters,
} from '@/utils/autonomyDetectResultDisplay'

const props = defineProps<{
  /** 当前检测任务 ID */
  taskId: string
  /** 来源汇总 Tab 是否可见 */
  visible: boolean
}>()

const emit = defineEmits<{
  /** 定位至文件证据 Tab 的首个命中文件 */
  locate: [item: AutonomySourceHitItem]
}>()

const {
  filterForm,
  loading,
  list: items,
  pagination,
  loadPage,
  handleSearch,
  handleReset,
} = useFilteredPaginatedList<AutonomySourceHitItem, ReturnType<typeof createEmptyAutonomySourceHitListFilters>>(
  async (params) => (await getAutonomyDetectSourceHitList(props.taskId, params)).data,
  {
    createEmptyFilters: createEmptyAutonomySourceHitListFilters,
    filtersToQuery: autonomySourceHitListFiltersToQuery,
    pageSize: 10,
    immediate: false,
  },
)

/** Tab 首次可见时加载来源汇总列表 */
watch(
  () => props.visible,
  (visible) => {
    if (visible && items.value.length === 0 && !loading.value) {
      loadPage()
    }
  },
  { immediate: true },
)
</script>

<style scoped>
.table-card {
  min-height: 240px;
}
</style>
