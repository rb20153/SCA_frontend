<template>
  <div class="page-container">
    <PageLoading :loading="overviewLoading && statCards.length === 0">
      <StatCardRow v-if="statCards.length > 0" :items="statCards" :columns="4" />
    </PageLoading>

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
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getKbQuarterUpdateList, getKbQuarterUpdateOverview } from '@/api/knowledge'
import ListEmptyGuide from '@/components/common/ListEmptyGuide.vue'
import PageLoading from '@/components/common/PageLoading.vue'
import StatCardRow from '@/components/common/StatCardRow.vue'
import KbQuarterUpdateQueryBar from '@/components/knowledge/KbQuarterUpdateQueryBar.vue'
import KbQuarterUpdateRecordTable from '@/components/knowledge/KbQuarterUpdateRecordTable.vue'
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
