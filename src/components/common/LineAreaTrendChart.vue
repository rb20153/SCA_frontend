<template>
  <div class="line-area-trend-chart">
    <div ref="chartRef" class="line-area-trend-chart__body" :style="{ height: `${height}px` }" />
    <div v-if="!hasData" class="line-area-trend-chart__empty" :style="{ height: `${height}px` }">
      <a-empty :description="emptyDescription" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { EChartsOption } from 'echarts'

import { useECharts } from '@/composables/useECharts'

export interface LineAreaTrendSeries {
  name: string
  data: number[]
  color: string
  areaColor?: string
}

const props = withDefaults(
  defineProps<{
    /** X 轴标签，与 series.data 一一对应 */
    xLabels: string[]
    /** tooltip 中展示的 X 轴标签；不传则使用 xLabels */
    tooltipLabels?: string[]
    /** 折线序列，支持单条或多条 */
    series: LineAreaTrendSeries[]
    /** 数值后缀，如 % */
    valueSuffix?: string
    /** 图表高度 */
    height?: number
    /** 空态文案 */
    emptyDescription?: string
    /** Y 轴最小值；不传则按数据自动计算 */
    yMin?: number
    /** Y 轴最大值；不传则按数据自动计算 */
    yMax?: number
    /** 是否显示面积填充 */
    showArea?: boolean
    /** 是否显示右侧图例 */
    showLegend?: boolean
    /** 是否显示全部 X 轴标签 */
    showAllXAxisLabels?: boolean
  }>(),
  {
    tooltipLabels: undefined,
    valueSuffix: '',
    height: 280,
    emptyDescription: '暂无趋势数据',
    yMin: undefined,
    yMax: undefined,
    showArea: true,
    showLegend: false,
    showAllXAxisLabels: false,
  },
)

const chartRef = ref<HTMLElement | null>(null)
const { setOption } = useECharts(chartRef)

const hasData = computed(() => props.xLabels.length > 0 && props.series.some((s) => s.data.length > 0))

/** 格式化 tooltip 数值，整数不带小数 */
function formatValue(value: number): string {
  const rounded = Math.round(value * 10) / 10
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
  return `${text}${props.valueSuffix}`
}

/** 计算 Y 轴范围，默认给上下留一点空间 */
function getYAxisRange() {
  const values = props.series.flatMap((item) => item.data)
  if (values.length === 0) return { min: 0, max: 100 }

  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const span = Math.max(1, maxValue - minValue)
  const min = props.yMin ?? Math.max(0, Math.floor(minValue - span * 0.18))
  const max = props.yMax ?? Math.ceil(maxValue + span * 0.18)

  return { min, max }
}

/** 生成 tooltip 内容，逐条展示序列值 */
function formatTooltip(params: unknown): string {
  const items = Array.isArray(params) ? params : [params]
  const first = items[0] as { dataIndex?: number } | undefined
  if (!first || first.dataIndex === undefined) return ''

  const index = first.dataIndex
  const title = props.tooltipLabels?.[index] ?? props.xLabels[index] ?? ''
  const rows = props.series.map((item) => {
    const value = item.data[index] ?? 0
    return `${item.name}：${formatValue(value)}`
  })

  return [title, ...rows].join('<br/>')
}

/** 构建低饱和折线图配置，可按页面需要开启面积和右侧图例 */
function buildOption(): EChartsOption {
  const { min, max } = getYAxisRange()

  return {
    animation: true,
    animationDuration: 900,
    animationEasing: 'cubicOut',
    animationDurationUpdate: 600,
    animationEasingUpdate: 'cubicOut',
    grid: { left: 58, right: props.showLegend ? 128 : 28, top: 24, bottom: 44 },
    legend: {
      show: props.showLegend,
      orient: 'vertical',
      right: 0,
      top: 'middle',
      itemWidth: 10,
      itemHeight: 10,
      textStyle: {
        color: 'rgba(0, 0, 0, 0.65)',
        fontSize: 12,
      },
    },
    tooltip: {
      trigger: 'axis',
      formatter: formatTooltip,
    },
    xAxis: {
      type: 'category',
      boundaryGap: true,
      data: props.xLabels,
      axisLabel: {
        color: 'rgba(0, 0, 0, 0.45)',
        hideOverlap: true,
        margin: 12,
        interval(index) {
          if (props.showAllXAxisLabels) return true
          return index === 0 || index === props.xLabels.length - 1 || index % 6 === 0
        },
      },
      axisLine: { lineStyle: { color: '#f0f0f0' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      min,
      max,
      axisLabel: {
        formatter: `{value}${props.valueSuffix}`,
        color: 'rgba(0, 0, 0, 0.45)',
        margin: 12,
      },
      splitLine: { lineStyle: { color: '#f0f0f0' } },
    },
    series: props.series.map((item) => ({
      name: item.name,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 5,
      animationDuration: 900,
      animationEasing: 'cubicOut',
      lineStyle: { width: 2, color: item.color },
      itemStyle: { color: item.color },
      ...(props.showArea ? { areaStyle: { color: item.areaColor ?? `${item.color}24` } } : {}),
      data: item.data,
    })),
  }
}

/** 数据变化后重绘趋势图 */
function renderChart() {
  if (!hasData.value) return
  setOption(buildOption())
}

onMounted(renderChart)

watch(
  () => [
    props.xLabels,
    props.tooltipLabels,
    props.series,
    props.yMin,
    props.yMax,
    props.showArea,
    props.showLegend,
    props.showAllXAxisLabels,
  ],
  renderChart,
  { deep: true },
)
</script>

<style scoped>
.line-area-trend-chart {
  position: relative;
}

.line-area-trend-chart__body {
  width: 100%;
}

.line-area-trend-chart__empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
}
</style>
