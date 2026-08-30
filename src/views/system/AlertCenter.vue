<template>
  <div class="page-container">
    <PageNavTabs
      v-model:active-key="queueStatus"
      :tabs="ALERT_QUEUE_TABS"
      @change="onTabChange"
    />

    <PageLoading :loading="overviewLoading && statCards.length === 0">
      <StatCardRow v-if="statCards.length > 0" :items="statCards" :columns="4" />
    </PageLoading>

    <AlertQueryBar
      v-model="filterForm"
      :show-read-filter="queueStatus === 'pending'"
      @search="handleSearch"
      @reset="handleReset"
    />

    <a-card :bordered="false" class="table-card">
      <PageLoading :loading="loading && alertList.length === 0">
        <ListEmptyGuide
          v-if="!loading && alertList.length === 0"
          :title="emptyTitle"
          :description="emptyDescription"
        />
        <AlertTable
          v-else
          :alerts="alertList"
          :queue-status="queueStatus"
          :loading="loading"
          :pagination="pagination"
          @detail="openDetailDrawer"
          @handle="openHandleModal"
          @timeline="openTimelineModal"
        />
      </PageLoading>
    </a-card>

    <AlertDetailDrawer
      v-model:open="detailVisible"
      :alert-id="viewingAlertId"
    />

    <AlertHandleModal
      v-model:open="handleVisible"
      :alert="handlingAlert"
      @success="onHandleSuccess"
    />

    <AlertTimelineModal
      v-model:open="timelineVisible"
      :alert-id="timelineAlertId"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { getAlertCenterOverview, getAlertList } from '@/api/system'
import ListEmptyGuide from '@/components/common/ListEmptyGuide.vue'
import PageLoading from '@/components/common/PageLoading.vue'
import PageNavTabs from '@/components/common/PageNavTabs.vue'
import StatCardRow from '@/components/common/StatCardRow.vue'
import AlertDetailDrawer from '@/components/system/AlertDetailDrawer.vue'
import AlertHandleModal from '@/components/system/AlertHandleModal.vue'
import AlertQueryBar from '@/components/system/AlertQueryBar.vue'
import AlertTable from '@/components/system/AlertTable.vue'
import AlertTimelineModal from '@/components/system/AlertTimelineModal.vue'
import { useFilteredPaginatedList } from '@/composables/useFilteredPaginatedList'
import type { StatCardItem } from '@/types/common'
import type { AlertListItem, AlertQueueStatus } from '@/types/system'
import {
  alertListFiltersToQuery,
  createEmptyAlertListFilters,
} from '@/utils/alertQuery'
import { ALERT_QUEUE_TABS } from '@/utils/alertDisplay'
import { mapAlertCenterToStatCards } from '@/utils/statCard'

const queueStatus = ref<AlertQueueStatus>('pending')
const route = useRoute()
const overviewLoading = ref(false)
const statCards = ref<StatCardItem[]>([])
const detailVisible = ref(false)
const viewingAlertId = ref<string | null>(null)
const handleVisible = ref(false)
const handlingAlert = ref<AlertListItem | null>(null)
const timelineVisible = ref(false)
const timelineAlertId = ref<string | null>(null)

const {
  filterForm,
  loading,
  list: alertList,
  pagination,
  handleSearch,
  handleReset,
} = useFilteredPaginatedList<AlertListItem, ReturnType<typeof createEmptyAlertListFilters>>(
  async (params) =>
    (await getAlertList({ ...params, status: queueStatus.value, alertId: typeof route.query.alertId === 'string' ? route.query.alertId : undefined })).data,
  {
    createEmptyFilters: createEmptyAlertListFilters,
    filtersToQuery: alertListFiltersToQuery,
    pageSize: 10,
    immediate: false,
  },
)

/** 空列表标题 */
const emptyTitle = computed(() =>
  queueStatus.value === 'pending' ? '暂无未处理告警' : '暂无已处理告警',
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

/** 打开处理告警弹窗 */
function openHandleModal(alert: AlertListItem) {
  handlingAlert.value = alert
  handleVisible.value = true
}

/** 打开处理时间线弹窗，弹窗内请求 getAlertTimeline */
function openTimelineModal(alert: AlertListItem) {
  timelineAlertId.value = alert.alertId
  timelineVisible.value = true
}

/** 处理弹窗提交成功后刷新概览与列表 */
async function onHandleSuccess(movedToHandled: boolean) {
  handlingAlert.value = null
  if (movedToHandled && queueStatus.value === 'pending') {
    await Promise.all([fetchOverview(), handleSearch()])
    return
  }
  await Promise.all([fetchOverview(), handleSearch()])
}

onMounted(async () => {
  await Promise.all([fetchOverview(), handleSearch()])
})
</script>

<style scoped>
.page-container {
  min-height: 100%;
}

.table-card {
  margin-top: 0;
}
</style>
