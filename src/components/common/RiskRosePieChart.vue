<template>
  <div class="risk-rose-pie-chart">
    <div ref="chartRef" class="risk-rose-pie-chart__body" :style="{ height: `${height}px` }" />
    <div v-if="!hasData" class="risk-rose-pie-chart__empty" :style="{ height: `${height}px` }">
      <a-empty :description="emptyDescription" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { EChartsOption } from 'echarts'

import { useECharts } from '@/composables/useECharts'

export interface RiskRosePieChartItem {
  name: string
  value: number
  color: string
}

const props = withDefaults(
  defineProps<{
    /** 玫瑰饼图数据，value 越大扇区半径越大 */
    items: RiskRosePieChartItem[]
    /** 图表高度 */
    height?: number
    /** 饼图中心位置 */
    center?: [string, string]
    /** 空态文案 */
    emptyDescription?: string
  }>(),
  {
    height: 280,
    center: () => ['50%', '54%'],
    emptyDescription: '暂无数据',
  },
)

const chartRef = ref<HTMLElement | null>(null)
const { setOption } = useECharts(chartRef)

const hasData = computed(() => props.items.some((item) => item.value > 0))

/** 将业务数据转成 ECharts 饼图扇区数据 */
function buildSeriesData(items: RiskRosePieChartItem[]) {
  return items.map((item) => ({
    name: item.name,
    value: item.value,
    itemStyle: { color: item.color, borderColor: '#fff', borderWidth: 2 },
    labelLine: { lineStyle: { color: item.color } },
  }))
}

/**
 * 构建半径玫瑰饼图配置
 * @param items - 已包含展示名称、数值与颜色的扇区数据
 */
function buildOption(items: RiskRosePieChartItem[]): EChartsOption {
  return {
    animation: true,
    animationDuration: 900,
    animationEasing: 'cubicOut',
    animationDurationUpdate: 600,
    animationEasingUpdate: 'cubicOut',
    tooltip: {
      trigger: 'item',
      formatter: '{b}<br/>数量：{c}<br/>占比：{d}%',
    },
    series: [
      {
        type: 'pie',
        roseType: 'radius',
        radius: ['20%', '72%'],
        center: props.center,
        avoidLabelOverlap: true,
        animationType: 'expansion',
        animationTypeUpdate: 'transition',
        label: {
          show: true,
          formatter: '{b}',
          color: 'rgba(0, 0, 0, 0.72)',
          fontSize: 13,
        },
        labelLine: {
          show: true,
          length: 18,
          length2: 14,
          smooth: 0.2,
        },
        emphasis: {
          scale: true,
          scaleSize: 8,
          label: { fontWeight: 600 },
        },
        data: buildSeriesData(items),
      },
    ],
  }
}

/** 数据变化后重绘玫瑰饼图 */
function renderChart() {
  if (!hasData.value) return
  setOption(buildOption(props.items))
}

onMounted(renderChart)

watch(() => props.items, renderChart, { deep: true })
</script>

<style scoped>
.risk-rose-pie-chart {
  position: relative;
}

.risk-rose-pie-chart__body {
  width: 100%;
}

.risk-rose-pie-chart__empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
}
</style>
