<template>
  <div class="ai-parse-coverage-bar">
    <span class="ai-parse-coverage-bar__label">AI解析覆盖率 {{ coverageText }}%</span>
    <div ref="chartRef" class="ai-parse-coverage-bar__chart" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { EChartsOption } from 'echarts'

import { useECharts } from '@/composables/useECharts'
import { formatFileTreeIssueRateValue } from '@/utils/fileTree'

const props = defineProps<{
  /** AI 解析覆盖率 0–100 */
  coverage: number
}>()

const chartRef = ref<HTMLElement | null>(null)
const { setOption } = useECharts(chartRef)

/** 展示用覆盖率文案 */
const coverageText = computed(() => formatFileTreeIssueRateValue(props.coverage))

/**
 * 构建水平覆盖率进度条（ECharts 单条 bar）
 * @param rate - 覆盖率 0–100
 */
function buildOption(rate: number): EChartsOption {
  const safeRate = Math.min(100, Math.max(0, rate))
  return {
    grid: { left: 0, right: 0, top: 0, bottom: 0, containLabel: false },
    xAxis: {
      type: 'value',
      max: 100,
      show: false,
    },
    yAxis: {
      type: 'category',
      data: [''],
      show: false,
    },
    series: [
      {
        type: 'bar',
        data: [safeRate],
        barWidth: 8,
        showBackground: true,
        backgroundStyle: {
          color: '#f0f0f0',
          borderRadius: 4,
        },
        itemStyle: {
          color: '#1677ff',
          borderRadius: 4,
        },
        animation: false,
      },
    ],
  }
}

onMounted(() => {
  setOption(buildOption(props.coverage), true)
})

watch(
  () => props.coverage,
  (rate) => {
    setOption(buildOption(rate), true)
  },
)
</script>

<style scoped>
.ai-parse-coverage-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.ai-parse-coverage-bar__label {
  flex-shrink: 0;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.88);
  white-space: nowrap;
}

.ai-parse-coverage-bar__chart {
  flex: 1;
  min-width: 0;
  height: 12px;
}
</style>
