<template>
  <div class="page-container">
    <a-tabs v-model:active-key="queueStatus" class="queue-tabs" @change="onTabChange">
      <a-tab-pane key="pending" tab="未处理" />
      <a-tab-pane key="handled" tab="已处理" />
    </a-tabs>

    <PageLoading :loading="overviewLoading && statCards.length === 0">
      <StatCardRow v-if="statCards.length > 0" :items="statCards" :columns="4" />
    </PageLoading>

    <AlertQueryBar
      v-model="filterForm"
      @search="handleSearch"
      @reset="handleReset"
    />

    <a-card :bordered="false" class="table-card">
      <PageLoading :loading="loading && alertList.length === 0">
        <ListEmptyGuide
          v-if="!loading && alertList.length === 0"
          title="暂无告警"
          :description="emptyDescription"
        />
        <AlertTable
          v-else
          :alerts="alertList"
          :queue-status="queueStatus"
          :loading="loading"
          :pagination="pagination"
          @detail="openDetailDrawer"
        />
      </PageLoading>
    </a-card>

    <AlertDetailDrawer
      v-model:open="detailVisible"
      :alert-id="viewingAlertId"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { getAlertCenterOverview, getAlertList } from '@/api/system'
import ListEmptyGuide from '@/components/common/ListEmptyGuide.vue'
import PageLoading from '@/components/common/PageLoading.vue'
import StatCardRow from '@/components/common/StatCardRow.vue'
import AlertDetailDrawer from '@/components/system/AlertDetailDrawer.vue'
import AlertQueryBar from '@/components/system/AlertQueryBar.vue'
import AlertTable from '@/components/system/AlertTable.vue'
import { useFilteredPaginatedList } from '@/composables/useFilteredPaginatedList'
import type { StatCardItem } from '@/types/common'
import type { AlertListItem, AlertQueueStatus } from '@/types/system'
import {
  alertListFiltersToQuery,
  createEmptyAlertListFilters,
} from '@/utils/alertQuery'
import { mapAlertCenterToStatCards } from '@/utils/statCard'

const queueStatus = ref<AlertQueueStatus>('pending')
const overviewLoading = ref(false)
const statCards = ref<StatCardItem[]>([])
const detailVisible = ref(false)
const viewingAlertId = ref<string | null>(null)

const {
  filterForm,
  loading,
  list: alertList,
  pagination,
  handleSearch,
  handleReset,
} = useFilteredPaginatedList<AlertListItem, ReturnType<typeof createEmptyAlertListFilters>>(
  async (params) =>
    (await getAlertList({ ...params, status: queueStatus.value })).data,
  {
    createEmptyFilters: createEmptyAlertListFilters,
    filtersToQuery: alertListFiltersToQuery,
    pageSize: 10,
    immediate: false,
  },
)

/** 空列表提示文案 */
const emptyDescription = computed(() =>
  queueStatus.value === 'pending'
    ? '当前筛选条件下没有未处理告警'
    : '当前筛选条件下没有已处理告警',
)

/** 拉取当前 Tab 对应的概览统计 */
async function fetchOverview() {
  overviewLoading.value = true
  try {
    const res = await getAlertCenterOverview({ status: queueStatus.value })
    statCards.value = mapAlertCenterToStatCards(res.data)
  } finally {
    overviewLoading.value = false
  }
}

/** 切换未处理 / 已处理 Tab 时重新请求概览与列表 */
async function onTabChange() {
  await Promise.all([fetchOverview(), handleSearch()])
}

/** 打开详情抽屉 */
function openDetailDrawer(alert: AlertListItem) {
  viewingAlertId.value = alert.alertId
  detailVisible.value = true
}

onMounted(async () => {
  await Promise.all([fetchOverview(), handleSearch()])
})
</script>

<style scoped>
.page-container {
  min-height: 100%;
}

.queue-tabs {
  margin-bottom: 16px;
}

.queue-tabs :deep(.ant-tabs-nav) {
  margin-bottom: 0;
}

.table-card {
  margin-top: 0;
}
</style>
