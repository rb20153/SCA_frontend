<template>
  <a-card :bordered="false" class="vuln-risk-summary">
    <template #title>
      <div class="vuln-risk-summary__title">
        <span>风险摘要</span>
        <span class="vuln-risk-summary__meta">
          漏洞总数 {{ summary?.total.toLocaleString('zh-CN') ?? '—' }} · 高危
          {{ summary?.highRiskCount.toLocaleString('zh-CN') ?? '—' }}
        </span>
      </div>
    </template>

    <PageLoading :loading="loading">
      <a-row :gutter="[16, 16]" align="middle">
        <a-col :xs="24" :lg="10">
          <div class="vuln-risk-summary__chart-title">风险等级分布</div>
          <RiskRosePieChart
            :items="roseItems"
            :height="252"
            empty-description="暂无风险等级数据"
          />
        </a-col>
        <a-col :xs="24" :lg="14">
          <div class="vuln-risk-summary__chart-title">高危来源排行</div>
          <div ref="barChartRef" class="vuln-risk-summary__bar-chart" />
        </a-col>
      </a-row>
      <ListEmptyGuide
        v-if="!loading && !hasData"
        title="暂无风险摘要"
        description="同步漏洞来源后将展示风险等级分布与高危来源排行"
      />
    </PageLoading>
  </a-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { EChartsOption } from 'echarts'

import { getVulnRiskSummary } from '@/api/knowledge'
import ListEmptyGuide from '@/components/common/ListEmptyGuide.vue'
import PageLoading from '@/components/common/PageLoading.vue'
import RiskRosePieChart, { type RiskRosePieChartItem } from '@/components/common/RiskRosePieChart.vue'
import { useECharts } from '@/composables/useECharts'
import type { VulnRiskSummary, VulnRiskSummarySource } from '@/types/knowledge'
import { formatVulnSourceSyncTime } from '@/utils/vulnKnowledgeDisplay'
import {
  VULN_RISK_LEVEL_COLOR,
  VULN_RISK_LEVEL_LABEL,
  VULN_RISK_LEVEL_ORDER,
} from '@/utils/vulnRiskLevel'

const loading = ref(false)
const summary = ref<VulnRiskSummary | null>(null)
const barChartRef = ref<HTMLElement | null>(null)
const { setOption } = useECharts(barChartRef)

const hasData = computed(() => summary.value !== null && summary.value.total > 0)

/** 将风险等级总量转成通用玫瑰饼图数据 */
const roseItems = computed<RiskRosePieChartItem[]>(() => {
  if (!summary.value) return []
  return VULN_RISK_LEVEL_ORDER.map((level) => ({
    name: VULN_RISK_LEVEL_LABEL[level],
    value: summary.value?.levelCounts[level] ?? 0,
    color: VULN_RISK_LEVEL_COLOR[level],
  }))
})

/** 按高危数量倒序展示漏洞来源 */
const rankedSources = computed<VulnRiskSummarySource[]>(() => {
  if (!summary.value) return []
  return [...summary.value.sources].sort((a, b) => b.high - a.high)
})

/** 计算高危占来源总量的比例 */
function getHighRiskRatio(source: VulnRiskSummarySource): string {
  if (source.total <= 0) return '0.0'
  return ((source.high / source.total) * 100).toFixed(1)
}

/** 构建右侧高危来源排行条形图 */
function buildBarOption(sources: VulnRiskSummarySource[]): EChartsOption {
  return {
    animation: true,
    animationDuration: 800,
    animationEasing: 'cubicOut',
    animationDurationUpdate: 500,
    animationEasingUpdate: 'cubicOut',
    grid: { left: 112, right: 32, top: 24, bottom: 28 },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter(params) {
        const items = Array.isArray(params) ? params : [params]
        const item = items[0]
        if (!item || item.dataIndex === undefined) return ''
        const source = sources[item.dataIndex]
        if (!source) return ''
        return [
          source.sourceName,
          `高危漏洞：${source.high.toLocaleString('zh-CN')}`,
          `来源总数：${source.total.toLocaleString('zh-CN')}`,
          `高危占比：${getHighRiskRatio(source)}%`,
          `最近同步：${formatVulnSourceSyncTime(source.lastSyncedAt)}`,
        ].join('<br/>')
      },
    },
    xAxis: {
      type: 'value',
      axisLabel: { color: 'rgba(0, 0, 0, 0.45)' },
      splitLine: { lineStyle: { color: '#f0f0f0' } },
    },
    yAxis: {
      type: 'category',
      data: sources.map((item) => item.sourceName),
      axisLabel: { color: 'rgba(0, 0, 0, 0.65)' },
      axisTick: { show: false },
      axisLine: { show: false },
    },
    series: [
      {
        name: '高危漏洞',
        type: 'bar',
        data: sources.map((item) => item.high),
        barWidth: 18,
        animationDelay: (index: number) => index * 80,
        itemStyle: {
          color: VULN_RISK_LEVEL_COLOR.high,
          borderRadius: [0, 9, 9, 0],
        },
        label: {
          show: true,
          position: 'right',
          color: 'rgba(0, 0, 0, 0.65)',
          formatter: '{c}',
        },
      },
    ],
  }
}

/** 重绘高危来源排行条形图 */
function renderBarChart() {
  if (rankedSources.value.length === 0) return
  setOption(buildBarOption(rankedSources.value))
}

/** 拉取漏洞知识库风险摘要 */
async function fetchRiskSummary() {
  loading.value = true
  try {
    const res = await getVulnRiskSummary()
    summary.value = res.data
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await fetchRiskSummary()
  renderBarChart()
})

watch(rankedSources, renderBarChart, { deep: true })
</script>

<style scoped>
.vuln-risk-summary {
  margin-bottom: 16px;
}

.vuln-risk-summary__title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.vuln-risk-summary__meta {
  font-size: 12px;
  font-weight: 400;
  color: rgba(0, 0, 0, 0.45);
}

.vuln-risk-summary__chart-title {
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.72);
}

.vuln-risk-summary__bar-chart {
  height: 252px;
}
</style>
