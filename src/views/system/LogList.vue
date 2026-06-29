<template>
  <div class="page-container">
    <div class="page-actions">
      <a-button @click="exportVisible = true">导出日志</a-button>
    </div>

    <LogQueryBar
      v-model="filterForm"
      @search="handleSearch"
      @reset="handleReset"
    />

    <a-card :bordered="false" class="table-card">
      <PageLoading :loading="loading && logList.length === 0">
        <ListEmptyGuide
          v-if="!loading && logList.length === 0"
          title="暂无日志"
          description="当前筛选条件下没有审计日志记录"
        />
        <LogTable
          v-else
          :logs="logList"
          :loading="loading"
          :pagination="pagination"
          @detail="openDetailDrawer"
        />
      </PageLoading>
    </a-card>

    <LogExportModal v-model:open="exportVisible" />

    <LogDetailDrawer
      v-model:open="detailVisible"
      :log-id="viewingLogId"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { getLogList } from '@/api/system'
import ListEmptyGuide from '@/components/common/ListEmptyGuide.vue'
import PageLoading from '@/components/common/PageLoading.vue'
import LogDetailDrawer from '@/components/system/LogDetailDrawer.vue'
import LogExportModal from '@/components/system/LogExportModal.vue'
import LogQueryBar from '@/components/system/LogQueryBar.vue'
import LogTable from '@/components/system/LogTable.vue'
import { useFilteredPaginatedList } from '@/composables/useFilteredPaginatedList'
import type { LogListItem } from '@/types/system'
import {
  createEmptyLogListFilters,
  logListFiltersToQuery,
} from '@/utils/logQuery'

const route = useRoute()

const exportVisible = ref(false)
const detailVisible = ref(false)
const viewingLogId = ref<string | null>(null)

const {
  filterForm,
  loading,
  list: logList,
  pagination,
  handleSearch,
  handleReset,
} = useFilteredPaginatedList<LogListItem, ReturnType<typeof createEmptyLogListFilters>>(
  async (params) => (await getLogList(params)).data,
  {
    createEmptyFilters: createEmptyLogListFilters,
    filtersToQuery: logListFiltersToQuery,
    pageSize: 10,
    immediate: false,
  },
)

/** 打开全链路详情抽屉 */
function openDetailDrawer(log: LogListItem) {
  viewingLogId.value = log.logId
  detailVisible.value = true
}

/** 从检测任务页或命中追溯页带参跳转时，自动填充日志筛选条件 */
function applyRouteLogFilter() {
  const resourceObject = route.query.resourceObject
  if (typeof resourceObject === 'string' && resourceObject) {
    filterForm.value.resourceObject = resourceObject
  }

  const traceId = route.query.traceId
  if (typeof traceId === 'string' && traceId) {
    filterForm.value.traceId = traceId
  }
}

onMounted(async () => {
  applyRouteLogFilter()
  await handleSearch()
})
</script>

<style scoped>
.page-container {
  min-height: 100%;
}

.page-actions {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 16px;
}

.table-card {
  margin-top: 0;
}
</style>
