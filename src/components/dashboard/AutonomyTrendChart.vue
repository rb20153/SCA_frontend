<template>
  <a-card title="近30日自主率趋势" :bordered="false" class="autonomy-trend-chart">
    <LineAreaTrendChart
      :x-labels="axisLabels"
      :tooltip-labels="tooltipLabels"
      :series="trendSeries"
      value-suffix="%"
      empty-description="暂无趋势数据"
      :y-min="yAxisMin"
      :y-max="yAxisMax"
    />
  </a-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import LineAreaTrendChart, { type LineAreaTrendSeries } from '@/components/common/LineAreaTrendChart.vue'
import type { DashboardAutonomyTrendPoint } from '@/types/dashboard'

const props = defineProps<{
  /** 近 N 日平均自主率序列 */
  points: DashboardAutonomyTrendPoint[]
}>()

const TREND_LINE_COLOR = '#7fb3e6'
const TREND_AREA_COLOR = 'rgba(127, 179, 230, 0.14)'

/** 将 ISO 日期格式化为 X 轴 MM-DD 标签 */
function formatAxisDate(date: string): string {
  const [, month, day] = date.split('-')
  return `${month}-${day}`
}

const axisLabels = computed(() => props.points.map((p) => formatAxisDate(p.date)))

const tooltipLabels = computed(() => props.points.map((p) => p.date))

const values = computed(() => props.points.map((p) => p.avgRate))

const yAxisMin = computed(() =>
  values.value.length > 0 ? Math.max(0, Math.floor(Math.min(...values.value) - 5)) : undefined,
)

const yAxisMax = computed(() =>
  values.value.length > 0 ? Math.min(100, Math.ceil(Math.max(...values.value) + 3)) : undefined,
)

/** 首页平均自主率单线趋势数据 */
const trendSeries = computed<LineAreaTrendSeries[]>(() => [
  {
    name: '平均自主率',
    data: values.value,
    color: TREND_LINE_COLOR,
    areaColor: TREND_AREA_COLOR,
  },
])
</script>

<style scoped>
.autonomy-trend-chart {
  height: 100%;
}
</style>
