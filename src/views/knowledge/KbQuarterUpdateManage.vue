<template>
  <div class="page-container">
    <PageLoading :loading="overviewLoading && statCards.length === 0">
      <StatCardRow v-if="statCards.length > 0" :items="statCards" :columns="4" />
    </PageLoading>

    <KbQuarterUpdateMaintainBar
      @start="startVisible = true"
      @rollback="rollbackVisible = true"
    />

    <KbQuarterUpdateQueryBar
      v-model="filterForm"
      @search="handleSearch"
      @reset="handleReset"
    />

    <a-card :bordered="false" class="table-card">
      <PageLoading :loading="loading && recordList.length === 0">
        <ListEmptyGuide
          v-if="!loading && recordList.length === 0"
          title="暂无季度更新记录"
          description="当前筛选条件下没有匹配的记录"
        />
        <KbQuarterUpdateRecordTable
          v-else
          :records="recordList"
          :loading="loading"
          :pagination="pagination"
        />
      </PageLoading>
    </a-card>

    <KbQuarterUpdateStartModal v-model:open="startVisible" @success="onMaintainSuccess" />

    <KbQuarterUpdateRollbackModal v-model:open="rollbackVisible" @success="onMaintainSuccess" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getKbQuarterUpdateList, getKbQuarterUpdateOverview } from '@/api/knowledge'
import ListEmptyGuide from '@/components/common/ListEmptyGuide.vue'
import PageLoading from '@/components/common/PageLoading.vue'
import StatCardRow from '@/components/common/StatCardRow.vue'
import KbQuarterUpdateMaintainBar from '@/components/knowledge/KbQuarterUpdateMaintainBar.vue'
import KbQuarterUpdateQueryBar from '@/components/knowledge/KbQuarterUpdateQueryBar.vue'
import KbQuarterUpdateRecordTable from '@/components/knowledge/KbQuarterUpdateRecordTable.vue'
import KbQuarterUpdateRollbackModal from '@/components/knowledge/KbQuarterUpdateRollbackModal.vue'
import KbQuarterUpdateStartModal from '@/components/knowledge/KbQuarterUpdateStartModal.vue'
import { useFilteredPaginatedList } from '@/composables/useFilteredPaginatedList'
import type { StatCardItem } from '@/types/common'
import type { KbQuarterUpdateRecord } from '@/types/knowledge'
import {
  createEmptyKbQuarterUpdateListFilters,
  kbQuarterUpdateListFiltersToQuery,
} from '@/utils/kbQuarterUpdateQuery'
import { mapKbQuarterUpdateToStatCards } from '@/utils/statCard'

const overviewLoading = ref(false)
const statCards = ref<StatCardItem[]>([])
const startVisible = ref(false)
const rollbackVisible = ref(false)

const {
  filterForm,
  loading,
  list: recordList,
  pagination,
  handleSearch,
  handleReset,
} = useFilteredPaginatedList<
  KbQuarterUpdateRecord,
  ReturnType<typeof createEmptyKbQuarterUpdateListFilters>
>(async (params) => (await getKbQuarterUpdateList(params)).data, {
  createEmptyFilters: createEmptyKbQuarterUpdateListFilters,
  filtersToQuery: kbQuarterUpdateListFiltersToQuery,
  pageSize: 10,
  immediate: false,
})

/** 拉取季度更新管理页顶部统计卡片 */
async function fetchOverview() {
  overviewLoading.value = true
  try {
    const res = await getKbQuarterUpdateOverview()
    statCards.value = mapKbQuarterUpdateToStatCards(res.data)
  } finally {
    overviewLoading.value = false
  }
}

/** 季度更新或回滚成功后刷新概览与记录列表。 */
async function onMaintainSuccess() {
  await Promise.all([fetchOverview(), handleSearch()])
}

onMounted(async () => {
  await Promise.all([fetchOverview(), handleSearch()])
})
</script>

<style scoped>
.page-container {
  padding: 0;
}

.table-card {
  margin-top: 0;
}
</style>
