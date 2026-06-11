<template>
  <div class="page-container">
    <PageLoading :loading="overviewLoading && statCards.length === 0">
      <StatCardRow v-if="statCards.length > 0" :items="statCards" />
    </PageLoading>

    <VulnKnowledgeRiskSummary />

    <VulnSourceMaintainBar
      @sync-all="syncAllVisible = true"
      @import="importVisible = true"
    />

    <VulnSourceQueryBar
      v-model="filterForm"
      @search="handleSearch"
      @reset="handleReset"
    />

    <a-card :bordered="false" class="table-card">
      <PageLoading :loading="loading && sourceList.length === 0">
        <ListEmptyGuide
          v-if="!loading && sourceList.length === 0"
          title="暂无漏洞来源"
          description="当前筛选条件下没有匹配的漏洞来源"
        />
        <VulnSourceTable
          v-else
          :sources="sourceList"
          :loading="loading"
          :pagination="pagination"
          @sync="openSyncModal"
        />
      </PageLoading>
    </a-card>

    <VulnSourceSyncModal
      v-model:open="syncVisible"
      :source="syncingSource"
      @success="onSyncSuccess"
    />

    <VulnSourceSyncAllModal v-model:open="syncAllVisible" @success="onMaintainSuccess" />

    <VulnSourceImportModal v-model:open="importVisible" @success="onMaintainSuccess" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getVulnKnowledgeOverview, getVulnSourceList } from '@/api/knowledge'
import ListEmptyGuide from '@/components/common/ListEmptyGuide.vue'
import PageLoading from '@/components/common/PageLoading.vue'
import StatCardRow from '@/components/common/StatCardRow.vue'
import VulnKnowledgeRiskSummary from '@/components/knowledge/VulnKnowledgeRiskSummary.vue'
import VulnSourceImportModal from '@/components/knowledge/VulnSourceImportModal.vue'
import VulnSourceMaintainBar from '@/components/knowledge/VulnSourceMaintainBar.vue'
import VulnSourceQueryBar from '@/components/knowledge/VulnSourceQueryBar.vue'
import VulnSourceSyncAllModal from '@/components/knowledge/VulnSourceSyncAllModal.vue'
import VulnSourceSyncModal from '@/components/knowledge/VulnSourceSyncModal.vue'
import VulnSourceTable from '@/components/knowledge/VulnSourceTable.vue'
import { useFilteredPaginatedList } from '@/composables/useFilteredPaginatedList'
import type { StatCardItem } from '@/types/common'
import type { VulnSource } from '@/types/knowledge'
import { mapVulnKnowledgeToStatCards } from '@/utils/statCard'
import {
  createEmptyVulnSourceListFilters,
  vulnSourceListFiltersToQuery,
} from '@/utils/vulnKnowledgeQuery'

const overviewLoading = ref(false)
const statCards = ref<StatCardItem[]>([])
const syncVisible = ref(false)
const syncAllVisible = ref(false)
const importVisible = ref(false)
const syncingSource = ref<VulnSource | null>(null)

const {
  filterForm,
  loading,
  list: sourceList,
  pagination,
  loadPage,
  handleSearch,
  handleReset,
} = useFilteredPaginatedList<VulnSource, ReturnType<typeof createEmptyVulnSourceListFilters>>(
  async (params) => (await getVulnSourceList(params)).data,
  {
    createEmptyFilters: createEmptyVulnSourceListFilters,
    filtersToQuery: vulnSourceListFiltersToQuery,
    pageSize: 10,
    immediate: false,
  },
)

/** 拉取漏洞知识库页顶部统计卡片 */
async function fetchOverview() {
  overviewLoading.value = true
  try {
    const res = await getVulnKnowledgeOverview()
    statCards.value = mapVulnKnowledgeToStatCards(res.data)
  } finally {
    overviewLoading.value = false
  }
}

/** 打开立即同步确认弹窗 */
function openSyncModal(source: VulnSource) {
  syncingSource.value = source
  syncVisible.value = true
}

/** 单条同步成功后刷新列表与概览 */
async function onSyncSuccess() {
  syncingSource.value = null
  await Promise.all([fetchOverview(), loadPage()])
}

/** 全库同步 / 导入离线包成功后刷新列表与概览 */
async function onMaintainSuccess() {
  await Promise.all([fetchOverview(), loadPage()])
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
