<template>
  <div class="page-container">
    <PageLoading :loading="loading && !overview">
      <a-empty v-if="!loading && !overview" description="暂无检测结果" />

      <template v-else-if="overview">
        <div class="result-hero">
          <AutonomyRateRing :rate="overview.totalAutonomyRate" sub-label="总体自主率" />
          <div class="result-hero__task">{{ overview.taskName }}</div>
          <div class="result-hero__project">项目：{{ overview.projectName }}</div>
        </div>

        <StatCardRow :items="statItems" :columns="4" />

        <PageNavTabs v-model:active-key="activeTab" :tabs="AUTONOMY_DETECT_RESULT_TABS" />

        <AutonomyEvidencePanel
          v-show="activeTab === 'evidence'"
          ref="evidencePanelRef"
          :task-id="taskId"
        />

        <AutonomySourceHitPanel
          v-show="activeTab === 'sources'"
          :task-id="taskId"
          :visible="activeTab === 'sources'"
          @locate="handleLocateFromSource"
        />
      </template>
    </PageLoading>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { message } from 'ant-design-vue'

import { getAutonomyDetectResultOverview } from '@/api/detect'
import type { AutonomyDetectResultOverview, AutonomyDetectResultTabKey, AutonomySourceHitItem } from '@/types/detect'
import type { StatCardItem } from '@/types/common'
import PageLoading from '@/components/common/PageLoading.vue'
import PageNavTabs from '@/components/common/PageNavTabs.vue'
import StatCardRow from '@/components/common/StatCardRow.vue'
import AutonomyRateRing from '@/components/detect/AutonomyRateRing.vue'
import AutonomyEvidencePanel from '@/components/detect/AutonomyEvidencePanel.vue'
import AutonomySourceHitPanel from '@/components/detect/AutonomySourceHitPanel.vue'
import { AUTONOMY_DETECT_RESULT_TABS } from '@/utils/autonomyDetectResultDisplay'

const route = useRoute()
const taskId = route.params.taskId as string

const loading = ref(false)
const overview = ref<AutonomyDetectResultOverview | null>(null)
const activeTab = ref<AutonomyDetectResultTabKey>('evidence')
const evidencePanelRef = ref<InstanceType<typeof AutonomyEvidencePanel> | null>(null)

/** 顶部统计卡片：问题文件数 / 代码问题 / 指纹问题 / 风险自主率 */
const statItems = computed<StatCardItem[]>(() => {
  const o = overview.value
  if (!o) return []
  return [
    { key: 'issueFile', label: '问题文件数', value: String(o.issueFileCount) },
    { key: 'codeIssue', label: '代码问题', value: String(o.codeIssueCount) },
    { key: 'fingerprintIssue', label: '指纹问题', value: String(o.fingerprintIssueCount) },
    { key: 'riskRate', label: '风险自主率', value: `${o.riskAutonomyRate}%` },
  ]
})

/** 页面进入时拉取顶部摘要 */
async function fetchOverview() {
  loading.value = true
  try {
    const res = await getAutonomyDetectResultOverview(taskId)
    overview.value = res.data
  } finally {
    loading.value = false
  }
}

/**
 * 来源汇总「定位」：切回文件证据 Tab，优先按 hitId 对齐树节点，再按命中文件路径/文件名匹配
 * @param item - 来源汇总行数据
 */
async function handleLocateFromSource(item: AutonomySourceHitItem) {
  activeTab.value = 'evidence'
  await nextTick()

  if (item.hitId && evidencePanelRef.value?.locateFileByNodeId(item.hitId)) {
    return
  }

  const fileCandidates = [
    item.filePath,
    ...item.hitFileNames,
  ].filter(Boolean)
  for (const fileName of fileCandidates) {
    if (evidencePanelRef.value?.locateFileByName(fileName)) {
      return
    }
  }

  if (fileCandidates.length === 0 && !item.hitId) {
    message.warning('该行无命中文件可定位')
    return
  }

  message.warning(
    fileCandidates.length > 0
      ? `未在证据树中找到文件「${fileCandidates[0]}」`
      : `未在证据树中找到节点「${item.hitId}」`,
  )
}

onMounted(fetchOverview)
</script>

<style scoped>
.page-container {
  padding: 24px;
}

.result-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 16px;
}

.result-hero__task {
  margin-top: 4px;
  font-size: 15px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.88);
  text-align: center;
}

.result-hero__project {
  margin-top: 2px;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.55);
  text-align: center;
}
</style>
