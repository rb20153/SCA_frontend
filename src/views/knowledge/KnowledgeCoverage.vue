<template>
  <div class="page-container">
    <PageLoading :loading="overviewLoading">
      <StatCardRow v-if="statCards.length > 0" :items="statCards" class="coverage-section" />
    </PageLoading>

    <a-row :gutter="[16, 16]" type="flex" class="coverage-section coverage-section--stretch">
      <a-col :xs="24" :lg="12" class="coverage-stretch-col">
        <div class="coverage-panel coverage-panel--fill">
          <h3 class="coverage-panel-title">分类覆盖</h3>
          <div class="coverage-panel-stack coverage-panel-stack--fill">
            <CoverageCategoryRateChart :stats="categoryStats" />
            <CoverageStatTable
              :columns="categoryColumns"
              :data-source="categoryStats"
              :loading="categoryLoading"
              row-key="category"
            />
          </div>
        </div>
      </a-col>

      <a-col :xs="24" :lg="12" class="coverage-stretch-col">
        <div class="coverage-panel coverage-panel--fill">
          <h3 class="coverage-panel-title">采集方式分布</h3>
          <div class="coverage-panel-stack coverage-panel-stack--fill">
            <CoverageCollectionMethodChart :stats="collectionMethodStats" />
            <CoverageStatTable
              :columns="collectionMethodColumns"
              :data-source="collectionMethodStats"
              :loading="collectionMethodLoading"
              row-key="method"
            />
          </div>
        </div>
      </a-col>
    </a-row>

    <a-row :gutter="[16, 16]" type="flex" class="coverage-section coverage-section--stretch">
      <a-col :xs="24" :lg="12" class="coverage-stretch-col">
        <div class="coverage-panel coverage-panel--fill">
          <h3 class="coverage-panel-title">待补全清单</h3>
          <a-card :bordered="false" class="coverage-pending-card">
            <PageLoading :loading="pendingLoading && pendingList.length === 0">
              <ListEmptyGuide
                v-if="!pendingLoading && pendingList.length === 0"
                title="暂无待补全项目"
                description="当前没有需要补全的知识库项目"
              />
              <CoveragePendingTable
                v-else
                :items="pendingList"
                :loading="pendingLoading"
                :pagination="pendingPagination"
              />
            </PageLoading>
          </a-card>
        </div>
      </a-col>

      <a-col :xs="24" :lg="12" class="coverage-stretch-col">
        <div class="coverage-panel coverage-panel--fill">
          <h3 class="coverage-panel-title">更新趋势</h3>
          <div class="coverage-panel-stack coverage-panel-stack--fill">
            <CoverageUpdateTrendChart :weeks="updateWeeks" />
            <CoverageUpdateWeekList :weeks="updateWeeks" :loading="updateTrendLoading" />
          </div>
        </div>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { TableColumnsType } from 'ant-design-vue'
import {
  getCategoryCoverageStats,
  getCollectionMethodCoverageStats,
  getCoveragePendingList,
  getCoverageUpdateTrendWeeks,
  getKnowledgeCoverageOverview,
} from '@/api/knowledge'
import ListEmptyGuide from '@/components/common/ListEmptyGuide.vue'
import PageLoading from '@/components/common/PageLoading.vue'
import StatCardRow from '@/components/common/StatCardRow.vue'
import CoverageCategoryRateChart from '@/components/knowledge/CoverageCategoryRateChart.vue'
import CoverageCollectionMethodChart from '@/components/knowledge/CoverageCollectionMethodChart.vue'
import CoveragePendingTable from '@/components/knowledge/CoveragePendingTable.vue'
import CoverageStatTable from '@/components/knowledge/CoverageStatTable.vue'
import CoverageUpdateTrendChart from '@/components/knowledge/CoverageUpdateTrendChart.vue'
import CoverageUpdateWeekList from '@/components/knowledge/CoverageUpdateWeekList.vue'
import { usePaginatedList } from '@/composables/usePaginatedList'
import type { StatCardItem } from '@/types/common'
import type {
  CategoryCoverageStat,
  CollectionMethodCoverageStat,
  CoverageUpdateTrendWeek,
} from '@/types/knowledge'
import { formatCoverageDuration, formatCoveragePercent } from '@/utils/coverageDisplay'
import { mapKnowledgeCoverageToStatCards } from '@/utils/statCard'

const overviewLoading = ref(false)
const categoryLoading = ref(false)
const collectionMethodLoading = ref(false)
const updateTrendLoading = ref(false)
const statCards = ref<StatCardItem[]>([])
const categoryStats = ref<CategoryCoverageStat[]>([])
const collectionMethodStats = ref<CollectionMethodCoverageStat[]>([])
const updateWeeks = ref<CoverageUpdateTrendWeek[]>([])

const {
  loading: pendingLoading,
  list: pendingList,
  pagination: pendingPagination,
  loadPage: loadPendingPage,
} = usePaginatedList(async (params) => (await getCoveragePendingList(params)).data, {
  pageSize: 6,
  immediate: false,
})

const categoryColumns: TableColumnsType<CategoryCoverageStat> = [
  { title: '分类', key: 'category', dataIndex: 'category', width: 120 },
  { title: '项目数', key: 'projectCount', dataIndex: 'projectCount', width: 100 },
  { title: '版本数', key: 'versionCount', dataIndex: 'versionCount', width: 100 },
  {
    title: '目录覆盖率',
    key: 'directoryCoverageRate',
    dataIndex: 'directoryCoverageRate',
    width: 120,
    customRender: ({ text }) => formatCoveragePercent(text as number),
  },
  {
    title: '漏洞映射率',
    key: 'vulnMappingRate',
    dataIndex: 'vulnMappingRate',
    width: 120,
    customRender: ({ text }) => formatCoveragePercent(text as number),
  },
]

const collectionMethodColumns: TableColumnsType<CollectionMethodCoverageStat> = [
  { title: '方式', key: 'method', dataIndex: 'method', width: 140 },
  { title: '项目数', key: 'projectCount', dataIndex: 'projectCount', width: 100 },
  {
    title: '成功率',
    key: 'successRate',
    dataIndex: 'successRate',
    width: 100,
    customRender: ({ text }) => formatCoveragePercent(text as number),
  },
  {
    title: '平均耗时',
    key: 'avgDurationMinutes',
    dataIndex: 'avgDurationMinutes',
    width: 120,
    customRender: ({ text }) => formatCoverageDuration(text as number),
  },
]

/** 拉取顶部概览卡片 */
async function fetchOverview() {
  overviewLoading.value = true
  try {
    const res = await getKnowledgeCoverageOverview()
    statCards.value = mapKnowledgeCoverageToStatCards(res.data)
  } finally {
    overviewLoading.value = false
  }
}

/** 拉取分类覆盖统计表 */
async function fetchCategoryStats() {
  categoryLoading.value = true
  try {
    const res = await getCategoryCoverageStats()
    categoryStats.value = res.data
  } finally {
    categoryLoading.value = false
  }
}

/** 拉取采集方式覆盖统计表 */
async function fetchCollectionMethodStats() {
  collectionMethodLoading.value = true
  try {
    const res = await getCollectionMethodCoverageStats()
    collectionMethodStats.value = res.data
  } finally {
    collectionMethodLoading.value = false
  }
}

/** 拉取最近六周更新趋势列表 */
async function fetchUpdateTrendWeeks() {
  updateTrendLoading.value = true
  try {
    const res = await getCoverageUpdateTrendWeeks()
    updateWeeks.value = res.data
  } finally {
    updateTrendLoading.value = false
  }
}

/** 并行加载覆盖统计页数据 */
async function fetchPageData() {
  await Promise.all([
    fetchOverview(),
    fetchCategoryStats(),
    fetchCollectionMethodStats(),
    fetchUpdateTrendWeeks(),
    loadPendingPage(),
  ])
}

onMounted(fetchPageData)
</script>

<style scoped>
.page-container {
  min-height: 100%;
}

.coverage-section {
  margin-bottom: 24px;
}

.coverage-section--stretch {
  align-items: stretch;
}

.coverage-stretch-col {
  display: flex;
}

.coverage-stretch-col > .coverage-panel {
  width: 100%;
}

.coverage-panel--fill {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.coverage-panel-title {
  margin: 0 0 16px;
  flex-shrink: 0;
  font-size: 16px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.88);
}

.coverage-panel-stack {
  overflow: hidden;
  background: #fff;
  border-radius: 8px;
  box-shadow:
    0 1px 2px 0 rgba(0, 0, 0, 0.03),
    0 1px 6px -1px rgba(0, 0, 0, 0.02),
    0 2px 4px 0 rgba(0, 0, 0, 0.02);
}

.coverage-panel-stack--fill {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.coverage-pending-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  box-shadow:
    0 1px 2px 0 rgba(0, 0, 0, 0.03),
    0 1px 6px -1px rgba(0, 0, 0, 0.02),
    0 2px 4px 0 rgba(0, 0, 0, 0.02);
}

.coverage-pending-card :deep(.ant-card-body) {
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>
