<template>
  <div class="coverage-update-trend-chart">
    <div class="coverage-update-trend-chart__title">近6周更新趋势</div>
    <LineAreaTrendChart
      :x-labels="xLabels"
      :tooltip-labels="tooltipLabels"
      :series="trendSeries"
      :height="252"
      :show-area="false"
      show-legend
      show-all-x-axis-labels
      empty-description="暂无更新趋势数据"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import LineAreaTrendChart, { type LineAreaTrendSeries } from '@/components/common/LineAreaTrendChart.vue'
import type { CoverageUpdateTrendWeek } from '@/types/knowledge'

const props = defineProps<{
  /** 最近 6 周覆盖更新趋势 */
  weeks: CoverageUpdateTrendWeek[]
}>()

const xLabels = computed(() => props.weeks.map((item) => item.weekLabel))

const tooltipLabels = computed(() => props.weeks.map((item) => `${item.weekLabel} · ${item.summary}`))

/** 覆盖统计更新趋势三条线：项目新增、目录补全、漏洞映射更新 */
const trendSeries = computed<LineAreaTrendSeries[]>(() => [
  {
    name: '新增项目',
    data: props.weeks.map((item) => item.addedProjectCount),
    color: '#7fb3e6',
  },
  {
    name: '目录补全',
    data: props.weeks.map((item) => item.completedDirectoryCount),
    color: '#8fcea0',
  },
  {
    name: '漏洞映射更新',
    data: props.weeks.map((item) => item.vulnMappingUpdateCount),
    color: '#e8c979',
  },
])
</script>

<style scoped>
.coverage-update-trend-chart {
  padding: 16px 16px 0;
}

.coverage-update-trend-chart__title {
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.72);
}
</style>
