<template>
  <div class="coverage-category-rate-chart">
    <div ref="chartRef" class="coverage-category-rate-chart__body" />
    <div v-if="!hasData" class="coverage-category-rate-chart__empty">
      <a-empty description="暂无分类覆盖数据" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { EChartsOption } from 'echarts'

import { useECharts } from '@/composables/useECharts'
import type { CategoryCoverageStat } from '@/types/knowledge'

const props = defineProps<{
  /** 分类覆盖统计数据 */
  stats: CategoryCoverageStat[]
}>()

const chartRef = ref<HTMLElement | null>(null)
const { setOption } = useECharts(chartRef)

const hasData = computed(() => props.stats.length > 0)

/** 构建分类覆盖百分比竖向分组柱状图 */
function buildOption(stats: CategoryCoverageStat[]): EChartsOption {
  return {
    animation: true,
    animationDuration: 800,
    animationEasing: 'cubicOut',
    animationDurationUpdate: 500,
    animationEasingUpdate: 'cubicOut',
    color: ['#7fb3e6', '#b7a6df'],
    grid: { left: 48, right: 32, top: 58, bottom: 46 },
    legend: {
      orient: 'horizontal',
      top: 10,
      right: 24,
      itemWidth: 10,
      itemHeight: 10,
      textStyle: {
        color: 'rgba(0, 0, 0, 0.65)',
        fontSize: 12,
      },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: '{b}<br/>{a0}：{c0}%<br/>{a1}：{c1}%',
    },
    xAxis: {
      type: 'category',
      data: stats.map((item) => item.category),
      axisLabel: {
        color: 'rgba(0, 0, 0, 0.65)',
        interval: 0,
      },
      axisLine: { lineStyle: { color: '#f0f0f0' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: {
        formatter: '{value}%',
        color: 'rgba(0, 0, 0, 0.45)',
      },
      splitLine: { lineStyle: { color: '#f0f0f0' } },
    },
    series: [
      {
        name: '目录覆盖率',
        type: 'bar',
        barWidth: 26,
        barGap: '55%',
        animationDelay: 0,
        data: stats.map((item) => item.directoryCoverageRate),
        itemStyle: { borderRadius: [6, 6, 0, 0] },
      },
      {
        name: '漏洞映射率',
        type: 'bar',
        barWidth: 26,
        barGap: '55%',
        animationDelay: 120,
        data: stats.map((item) => item.vulnMappingRate),
        itemStyle: { borderRadius: [6, 6, 0, 0] },
      },
    ],
  }
}

/** 数据变化后重绘分类覆盖柱状图 */
function renderChart() {
  if (!hasData.value) return
  setOption(buildOption(props.stats))
}

onMounted(renderChart)

watch(() => props.stats, renderChart, { deep: true })
</script>

<style scoped>
.coverage-category-rate-chart {
  position: relative;
  padding: 8px 16px 0;
}

.coverage-category-rate-chart__body {
  height: 280px;
}

.coverage-category-rate-chart__empty {
  position: absolute;
  inset: 8px 16px 0;
  height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
}
</style>
