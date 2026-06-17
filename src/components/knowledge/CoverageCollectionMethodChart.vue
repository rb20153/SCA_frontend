<template>
  <div class="coverage-collection-method-chart">
    <div ref="chartRef" class="coverage-collection-method-chart__body" />
    <div v-if="!hasData" class="coverage-collection-method-chart__empty">
      <a-empty description="暂无采集方式数据" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { EChartsOption } from 'echarts'

import { useECharts } from '@/composables/useECharts'
import type { CollectionMethodCoverageStat } from '@/types/knowledge'

const props = defineProps<{
  /** 采集方式覆盖统计数据 */
  stats: CollectionMethodCoverageStat[]
}>()

const chartRef = ref<HTMLElement | null>(null)
const { setOption } = useECharts(chartRef)

const hasData = computed(() => props.stats.length > 0)

/** 汇总所有分类名称，保证每种采集方式使用同一组堆叠柱 series */
function getCategoryNames(stats: CollectionMethodCoverageStat[]): string[] {
  const names = new Set<string>()
  stats.forEach((item) => {
    item.categoryCounts.forEach((category) => {
      names.add(category.category)
    })
  })
  return [...names]
}

/**
 * 读取指定采集方式下某分类的项目数
 * @param stat - 单个采集方式统计行
 * @param category - 分类名称
 */
function getCategoryProjectCount(stat: CollectionMethodCoverageStat, category: string): number {
  return stat.categoryCounts.find((item) => item.category === category)?.projectCount ?? 0
}

/** 构建采集方式分布：分类堆叠柱展示项目数，成功率散点展示稳定性 */
function buildOption(stats: CollectionMethodCoverageStat[]): EChartsOption {
  const categoryNames = getCategoryNames(stats)
  const categoryColors = ['#7fb3e6', '#8fcea0', '#e8c979', '#b7a6df']

  return {
    animation: true,
    animationDuration: 800,
    animationEasing: 'cubicOut',
    animationDurationUpdate: 500,
    animationEasingUpdate: 'cubicOut',
    color: [...categoryColors, '#e88f8f'],
    grid: { left: 48, right: 124, top: 28, bottom: 36 },
    legend: {
      orient: 'vertical',
      top: 'middle',
      right: 12,
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
      valueFormatter: (value) => `${value}`,
    },
    xAxis: {
      type: 'category',
      data: stats.map((item) => item.method),
      axisLabel: {
        color: 'rgba(0, 0, 0, 0.65)',
        interval: 0,
      },
      axisLine: { lineStyle: { color: '#f0f0f0' } },
      axisTick: { show: false },
    },
    yAxis: [
      {
        type: 'value',
        name: '项目数',
        minInterval: 1,
        axisLabel: {
          color: 'rgba(0, 0, 0, 0.45)',
        },
        splitLine: { lineStyle: { color: '#f0f0f0' } },
      },
      {
        type: 'value',
        name: '成功率',
        min: 0,
        max: 100,
        axisLabel: {
          formatter: '{value}%',
          color: 'rgba(0, 0, 0, 0.45)',
        },
        splitLine: { show: false },
      },
    ],
    series: [
      ...categoryNames.map((category, index) => ({
        name: category,
        type: 'bar' as const,
        stack: '项目数',
        barWidth: 42,
        animationDelay: index * 120,
        data: stats.map((item) => getCategoryProjectCount(item, category)),
        itemStyle: {
          color: categoryColors[index % categoryColors.length],
        },
      })),
      {
        name: '成功率',
        type: 'scatter',
        yAxisIndex: 1,
        symbol: 'circle',
        symbolSize: 10,
        animationDelay: categoryNames.length * 120,
        data: stats.map((item) => item.successRate),
        itemStyle: { color: '#e88f8f' },
      },
    ],
  }
}

/** 数据变化后重绘采集方式组合图 */
function renderChart() {
  if (!hasData.value) return
  setOption(buildOption(props.stats))
}

onMounted(renderChart)

watch(() => props.stats, renderChart, { deep: true })
</script>

<style scoped>
.coverage-collection-method-chart {
  position: relative;
  padding: 8px 16px 0;
}

.coverage-collection-method-chart__body {
  height: 336px;
}

.coverage-collection-method-chart__empty {
  position: absolute;
  inset: 8px 16px 0;
  height: 336px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
}
</style>
