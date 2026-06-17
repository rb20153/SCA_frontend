<template>
  <div
    ref="chartRef"
    class="autonomy-rate-ring"
    :style="{ width: `${size}px`, height: `${size}px` }"
  />
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import type { EChartsOption } from 'echarts'

import { useECharts } from '@/composables/useECharts'
import { getAutonomyRateColor } from '@/utils/autonomyRate'

const props = withDefaults(
  defineProps<{
    /** 自主率，0–100 */
    rate: number
    /** 环心下方说明文字 */
    subLabel?: string
    /** 图表容器尺寸（px，宽高一致） */
    size?: number
  }>(),
  {
    subLabel: '总体自主率',
    size: 140,
  },
)

const chartRef = ref<HTMLElement | null>(null)
const { setOption } = useECharts(chartRef)

/** 格式化环心百分比展示（保留 1 位小数，整数不带 .0） */
function formatRateText(rate: number): string {
  const rounded = Math.round(rate * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

/**
 * 根据自主率构建空心环形图配置
 * - 自主部分按阈值变色（<50 红 / 50–80 黄 / ≥80 绿），剩余部分用浅灰
 * - 环心用 graphic 分组精确居中，避免 title/subtext 在小尺寸下偏移
 * @param rate - 自主率，0–100
 */
function buildOption(rate: number): EChartsOption {
  const safeRate = Math.min(100, Math.max(0, rate))
  const color = getAutonomyRateColor(safeRate)
  const rateText = `${formatRateText(safeRate)}%`
  return {
    animation: true,
    animationDuration: 800,
    animationEasing: 'cubicOut',
    animationDurationUpdate: 500,
    animationEasingUpdate: 'cubicOut',
    graphic: {
      type: 'group',
      left: 'center',
      top: 'middle',
      bounding: 'raw',
      children: [
        {
          type: 'text',
          style: {
            text: rateText,
            x: 0,
            y: -8,
            align: 'center',
            verticalAlign: 'middle',
            fill: color,
            fontSize: 20,
            fontWeight: 700,
          },
        },
        {
          type: 'text',
          style: {
            text: props.subLabel,
            x: 0,
            y: 10,
            align: 'center',
            verticalAlign: 'middle',
            fill: 'rgba(0, 0, 0, 0.45)',
            fontSize: 11,
          },
        },
      ],
    },
    series: [
      {
        type: 'pie',
        radius: ['72%', '92%'],
        center: ['50%', '50%'],
        startAngle: 90,
        silent: true,
        animationType: 'expansion',
        animationTypeUpdate: 'transition',
        label: { show: false },
        labelLine: { show: false },
        data: [
          { value: safeRate, itemStyle: { color, borderRadius: 6 } },
          { value: 100 - safeRate, itemStyle: { color: '#f0f0f0' } },
        ],
      },
    ],
  }
}

// useECharts 的 onMounted 先注册（init 实例），本组件 onMounted 后执行，此时实例已就绪
onMounted(() => {
  setOption(buildOption(props.rate))
})

// rate 变化后重绘；首帧由上方 onMounted 负责，避免在实例 init 前 setOption 丢失
watch(
  () => props.rate,
  (rate) => {
    setOption(buildOption(rate))
  },
)
</script>

<style scoped>
.autonomy-rate-ring {
  flex-shrink: 0;
  overflow: visible;
}
</style>
