<template>
  <div class="dashboard-page">
    <a-spin :spinning="loading">
      <!-- 顶部统计卡片 -->
      <a-row :gutter="[16, 16]" class="dashboard-section">
        <a-col v-for="item in stats" :key="item.key" :xs="24" :sm="12" :lg="6">
          <StatCard
            :label="item.label"
            :value="item.value"
            :suffix="item.suffix"
            :growth="item.growth"
            :growth-suffix="item.growthSuffix"
            :warn-value="item.warnValue"
          />
        </a-col>
      </a-row>

      <!-- 图表占位区 -->
      <a-row :gutter="[16, 16]" class="dashboard-section">
        <a-col :xs="24" :lg="14">
          <ChartPlaceholder title="自主率趋势" description="图表占位，待接入后端数据" />
        </a-col>
        <a-col :xs="24" :lg="10">
          <ChartPlaceholder title="漏洞风险分布" description="图表占位，待接入后端数据" />
        </a-col>
      </a-row>

      <!-- 最近任务 -->
      <div class="dashboard-section">
        <h3 class="section-title">最近任务</h3>
        <a-card :bordered="false">
          <a-spin :spinning="tasksLoading">
            <a-empty v-if="!tasksLoading && recentTasks.length === 0" class="recent-empty">
              <template #description>
                <p class="recent-empty__title">暂无最近任务</p>
                <p class="recent-empty__hint">
                  还没有检测任务记录，前往
                  <router-link to="/detect/tasks">检测任务</router-link>
                  创建并执行扫描
                </p>
              </template>
            </a-empty>
            <DetectTaskTable v-else :tasks="recentTasks" :pagination="false" />
          </a-spin>
        </a-card>
      </div>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getDashboardOverview, getRecentTasks } from '@/api/dashboard'
import type { DashboardStatItem } from '@/types/dashboard'
import type { DetectTask } from '@/types/detect'
import StatCard from '@/components/dashboard/StatCard.vue'
import ChartPlaceholder from '@/components/dashboard/ChartPlaceholder.vue'
import DetectTaskTable from '@/components/detect/DetectTaskTable.vue'

const loading = ref(false)
const tasksLoading = ref(false)
const stats = ref<DashboardStatItem[]>([])
const recentTasks = ref<DetectTask[]>([])

/** 拉取首页统计数据 */
async function fetchOverview() {
  const overviewRes = await getDashboardOverview()
  stats.value = overviewRes.data.stats
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

/** 并行加载首页数据 */
async function fetchDashboardData() {
  loading.value = true
  try {
    await Promise.all([fetchOverview(), fetchRecentTasks()])
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

.recent-empty {
  padding: 32px 0;
}

.recent-empty__title {
  margin: 0 0 8px;
  color: rgba(0, 0, 0, 0.45);
  font-size: 14px;
}

.recent-empty__hint {
  margin: 0;
  color: rgba(0, 0, 0, 0.45);
  font-size: 13px;
}

.recent-empty__hint a {
  color: #1677ff;
}
</style>
