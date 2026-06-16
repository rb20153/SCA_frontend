<template>
  <div class="page-container">
    <PageLoading :loading="loadingHead && !headInfo">
      <a-empty v-if="!loadingHead && !headInfo" description="任务不存在或已删除" />
      <template v-else-if="headInfo">
        <OpenSourceRiskDetailHead :head-info="headInfo" />

        <a-spin :spinning="loadingSummary">
          <StatCardRow v-if="statCards.length > 0" :items="statCards" class="risk-summary-row" />
        </a-spin>

        <PageNavTabs v-model:active-key="activeTab" :tabs="OPEN_SOURCE_RISK_DETAIL_TABS" />

        <a-card v-show="activeTab === 'sbom'" :bordered="false" class="tab-content-card">
          <div class="tab-placeholder" />
        </a-card>

        <OpenSourceRiskComponentPanel
          v-show="activeTab === 'components'"
          :task-id="taskId"
          :visible="activeTab === 'components'"
          @view-vulnerabilities="handleViewComponentVulnerabilities"
          @summary-changed="loadSummary"
        />

        <OpenSourceRiskVulnerabilityPanel
          ref="vulnerabilityPanelRef"
          v-show="activeTab === 'vulnerabilities'"
          :task-id="taskId"
          :visible="activeTab === 'vulnerabilities'"
        />
      </template>
    </PageLoading>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getOpenSourceRiskDetailSummary, getTaskDetail } from '@/api/detect'
import PageLoading from '@/components/common/PageLoading.vue'
import PageNavTabs from '@/components/common/PageNavTabs.vue'
import StatCardRow from '@/components/common/StatCardRow.vue'
import OpenSourceRiskDetailHead from '@/components/detect/OpenSourceRiskDetailHead.vue'
import OpenSourceRiskComponentPanel from '@/components/detect/OpenSourceRiskComponentPanel.vue'
import OpenSourceRiskVulnerabilityPanel from '@/components/detect/OpenSourceRiskVulnerabilityPanel.vue'
import type { StatCardItem } from '@/types/common'
import type { DetectTask, OpenSourceRiskDetailHeadInfo, OpenSourceRiskDetailTabKey } from '@/types/detect'
import {
  OPEN_SOURCE_RISK_DETAIL_TABS,
  buildOpenSourceRiskHeadInfo,
  mapOpenSourceRiskSummaryToStatCards,
} from '@/utils/openSourceRiskDisplay'

const route = useRoute()

const loadingHead = ref(false)
const loadingSummary = ref(false)
const headInfo = ref<OpenSourceRiskDetailHeadInfo | null>(null)
const statCards = ref<StatCardItem[]>([])
const activeTab = ref<OpenSourceRiskDetailTabKey>('components')
const vulnerabilityPanelRef = ref<InstanceType<typeof OpenSourceRiskVulnerabilityPanel> | null>(
  null,
)

/** 从组件详情抽屉跳转漏洞 Tab 并筛选当前组件 */
async function handleViewComponentVulnerabilities(componentName: string) {
  activeTab.value = 'vulnerabilities'
  await nextTick()
  await vulnerabilityPanelRef.value?.applyComponentFilter(componentName)
}

/** 路由参数中的任务 ID */
const taskId = computed(() => String(route.params.taskId ?? ''))

/** 列表跳转时通过 history.state 携带的任务（刷新后失效） */
const navigationTask = computed<DetectTask | undefined>(() => {
  const state = history.state as { task?: DetectTask } | null
  if (state?.task?.taskId === taskId.value) {
    return state.task
  }
  return undefined
})

/** 将任务实体写入顶部摘要区 */
function applyHeadFromTask(task: DetectTask) {
  headInfo.value = buildOpenSourceRiskHeadInfo(task)
}

/** 优先使用跳转携带的任务，否则请求详情 API */
async function loadHeadInfo() {
  const id = taskId.value
  if (!id) {
    headInfo.value = null
    return
  }

  if (navigationTask.value) {
    applyHeadFromTask(navigationTask.value)
    return
  }

  loadingHead.value = true
  try {
    const res = await getTaskDetail(id)
    if (res.data.taskType !== 'open-source-risk') {
      headInfo.value = buildOpenSourceRiskHeadInfo(res.data)
      return
    }
    applyHeadFromTask(res.data)
  } catch {
    headInfo.value = null
  } finally {
    loadingHead.value = false
  }
}

/** 拉取结果统计卡片数据 */
async function loadSummary() {
  const id = taskId.value
  if (!id || !headInfo.value) {
    statCards.value = []
    return
  }

  loadingSummary.value = true
  try {
    const res = await getOpenSourceRiskDetailSummary(id)
    statCards.value = mapOpenSourceRiskSummaryToStatCards(res.data)
  } catch {
    statCards.value = []
  } finally {
    loadingSummary.value = false
  }
}

watch(
  taskId,
  () => {
    activeTab.value = 'components'
    void loadHeadInfo().then(() => loadSummary())
  },
  { immediate: true },
)
</script>

<style scoped>
.page-container {
  min-height: 100%;
}

.risk-summary-row {
  margin-bottom: 16px;
}

.tab-content-card {
  min-height: 240px;
}

.tab-placeholder {
  min-height: 200px;
}
</style>
