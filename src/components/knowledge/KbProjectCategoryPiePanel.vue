<template>
  <a-card :bordered="false" class="kb-category-pie-panel">
    <template #title>
      <div class="kb-category-pie-panel__title">
        <span>分类入库</span>
        <span class="kb-category-pie-panel__meta">
          入库总数 {{ overview?.totalCount.toLocaleString('zh-CN') ?? '—' }}
        </span>
      </div>
    </template>

    <PageLoading :loading="loading">
      <div ref="chartRef" class="kb-category-pie-panel__chart" />
      <ListEmptyGuide
        v-if="!loading && !hasData"
        class="kb-category-pie-panel__empty"
        title="暂无分类数据"
        description="添加入库项目后将展示各分类占比"
      />
    </PageLoading>
  </a-card>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import type { EChartsOption } from 'echarts'
import { getKbProjectOverview } from '@/api/knowledge'
import ListEmptyGuide from '@/components/common/ListEmptyGuide.vue'
import PageLoading from '@/components/common/PageLoading.vue'
import { useECharts } from '@/composables/useECharts'
import type { KbProjectOverview } from '@/types/knowledge'
import {
  KB_PROJECT_CATEGORY_LABEL,
  KB_PROJECT_CATEGORY_ORDER,
  KB_PROJECT_CATEGORY_PIE_COLOR,
} from '@/utils/knowledgeDisplay'

const loading = ref(false)
const overview = ref<KbProjectOverview | null>(null)
const chartRef = ref<HTMLElement | null>(null)
const { setOption, resize } = useECharts(chartRef)

const hasData = computed(() => (overview.value?.totalCount ?? 0) > 0)

/** 构建普通扇形图配置（非玫瑰图） */
function buildPieOption(data: KbProjectOverview): EChartsOption {
  const seriesData = KB_PROJECT_CATEGORY_ORDER.map((category) => ({
    name: KB_PROJECT_CATEGORY_LABEL[category],
    value: data.categoryCounts[category] ?? 0,
    itemStyle: { color: KB_PROJECT_CATEGORY_PIE_COLOR[category] },
  }))

  return {
    animation: true,
    animationDuration: 800,
    animationEasing: 'cubicOut',
    tooltip: {
      trigger: 'item',
      formatter: '{b}：{c}',
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      left: 'center',
      itemWidth: 8,
      itemHeight: 8,
      itemGap: 8,
      textStyle: { color: 'rgba(0, 0, 0, 0.55)', fontSize: 11 },
    },
    series: [
      {
        type: 'pie',
        radius: '72%',
        center: ['50%', '44%'],
        avoidLabelOverlap: true,
        label: { show: false },
        labelLine: { show: false },
        itemStyle: { borderColor: '#fff', borderWidth: 2 },
        data: seriesData,
      },
    ],
  }
}

/** 重绘分类扇形图，并在布局稳定后校正 canvas 宽度 */
function renderChart() {
  if (!overview.value || !hasData.value) return
  setOption(buildPieOption(overview.value))
  nextTick(() => {
    requestAnimationFrame(() => {
      resize()
    })
  })
}

/** 拉取分类入库概览并驱动图表 */
async function fetchOverview() {
  loading.value = true
  try {
    const res = await getKbProjectOverview()
    overview.value = res.data
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await fetchOverview()
  renderChart()
})

watch(overview, renderChart, { deep: true })

/** loading 结束后栅格宽度已稳定，再校正一次图表尺寸 */
watch(loading, (isLoading) => {
  if (isLoading || !hasData.value) return
  nextTick(() => {
    requestAnimationFrame(() => {
      resize()
    })
  })
})

/** 供父级在增删改后刷新分类图 */
defineExpose({
  refresh: fetchOverview,
})
</script>

<style scoped>
.kb-category-pie-panel {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.kb-category-pie-panel :deep(.ant-card-body) {
  position: relative;
  min-height: 280px;
  overflow: hidden;
}

.kb-category-pie-panel__title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.kb-category-pie-panel__meta {
  font-size: 12px;
  font-weight: 400;
  color: rgba(0, 0, 0, 0.45);
}

.kb-category-pie-panel__chart {
  width: 100%;
  max-width: 100%;
  height: 268px;
}

.kb-category-pie-panel__empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.92);
}
</style>
