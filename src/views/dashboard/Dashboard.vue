<template>
  <div class="dashboard-page">
    <PageLoading :loading="loading">
      <!-- 顶部统计卡片 -->
      <StatCardRow :items="statCards" class="dashboard-section" />

      <!-- 图表区 -->
      <a-row :gutter="[16, 16]" class="dashboard-section">
        <a-col :xs="24" :lg="14">
          <AutonomyTrendChart :points="autonomyTrendPoints" />
        </a-col>
        <a-col :xs="24" :lg="10">
          <VulnRiskDistributionChart
            :items="vulnDistributionItems"
            :total="vulnDistributionTotal"
          />
        </a-col>
      </a-row>

      <!-- 最近任务 -->
      <div class="dashboard-section">
        <h3 class="section-title">最近任务</h3>
        <a-card :bordered="false">
          <PageLoading :loading="tasksLoading">
            <ListEmptyGuide
              v-if="!tasksLoading && recentTasks.length === 0"
              title="暂无最近任务"
              hint-before="还没有检测任务记录，前往"
              link-to="/detect/tasks"
              link-text="检测任务"
              hint-after="创建并执行扫描"
            />
            <DetectTaskTable v-else :tasks="recentTasks" :pagination="false" />
          </PageLoading>
        </a-card>
      </div>
    </PageLoading>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

import {
  getAutonomyTrend,
  getDashboardOverview,
  getRecentTasks,
  getVulnerabilityDistribution,
} from '@/api/dashboard'
import ListEmptyGuide from '@/components/common/ListEmptyGuide.vue'
import PageLoading from '@/components/common/PageLoading.vue'
import StatCardRow from '@/components/common/StatCardRow.vue'
import AutonomyTrendChart from '@/components/dashboard/AutonomyTrendChart.vue'
import VulnRiskDistributionChart from '@/components/dashboard/VulnRiskDistributionChart.vue'
import DetectTaskTable from '@/components/detect/DetectTaskTable.vue'
import type { StatCardItem } from '@/types/common'
import type {
  DashboardAutonomyTrendPoint,
  DashboardVulnRiskDistributionItem,
} from '@/types/dashboard'
import type { DetectTask } from '@/types/detect'
import { mapDashboardStatsToStatCards } from '@/utils/statCard'

const loading = ref(false)
const tasksLoading = ref(false)
const statCards = ref<StatCardItem[]>([])
const recentTasks = ref<DetectTask[]>([])
const autonomyTrendPoints = ref<DashboardAutonomyTrendPoint[]>([])
const vulnDistributionItems = ref<DashboardVulnRiskDistributionItem[]>([])
const vulnDistributionTotal = ref(0)

/** 拉取首页统计数据 */
async function fetchOverview() {
  const overviewRes = await getDashboardOverview()
  statCards.value = mapDashboardStatsToStatCards(overviewRes.data.stats)
}

/** 拉取近 30 天平均自主率趋势 */
async function fetchAutonomyTrend() {
  const trendRes = await getAutonomyTrend(30)
  autonomyTrendPoints.value = trendRes.data.points
}

/** 拉取漏洞风险三档分布 */
async function fetchVulnerabilityDistribution() {
  const distributionRes = await getVulnerabilityDistribution()
  vulnDistributionItems.value = distributionRes.data.items
  vulnDistributionTotal.value = distributionRes.data.total
}

/** 拉取最近任务（最多 10 条，api 层已排序截断） */
async function fetchRecentTasks() {
  tasksLoading.value = true
  try {
    const tasksRes = await getRecentTasks()
    recentTasks.value = tasksRes.data
  } finally {
    tasksLoading.value = false
  }
}

/** 并行加载首页数据（统计、图表、最近任务） */
async function fetchDashboardData() {
  loading.value = true
  try {
    await Promise.all([
      fetchOverview(),
      fetchAutonomyTrend(),
      fetchVulnerabilityDistribution(),
      fetchRecentTasks(),
    ])
  } finally {
    loading.value = false
  }
}

onMounted(fetchDashboardData)
</script>

<style scoped>
.dashboard-page {
  min-height: 100%;
}

.dashboard-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.88);
  margin: 0 0 16px;
}
</style>
