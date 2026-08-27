<template>
  <a-drawer
    v-model:open="visible"
    :title="drawerTitle"
    placement="right"
    :width="640"
    destroy-on-close
    :footer="null"
  >
    <PageLoading :loading="loading && !detail">
      <a-empty v-if="!loading && !detail" description="暂无解析结果" />

      <template v-else-if="detail">
        <div class="ai-result-head">
          <div class="ai-result-head__left">
            <a-tag :color="analysisTagColor">{{ analysisModeLabel }}</a-tag>
            <span class="ai-result-head__status">解析完成</span>
          </div>
          <span class="ai-result-head__meta">
            扫描深度：{{ detail.scanDepth }} · 置信度：{{ confidenceText }} ·
            {{ formatDurationMs(detail.elapsedMs) }} · {{ finishedAtText }}
          </span>
        </div>

        <a-alert
          v-if="detail.fallbackUsed"
          type="warning"
          show-icon
          :message="detail.fallbackReason || '外部 AI 模型未启用，本次采用许可证规则库完成分析'"
          class="fallback-alert"
        />

        <AiParseCoverageBar :coverage="detail.aiParseCoverage" />

        <h3 class="section-title">License 树</h3>
        <LinuxStyleFileTree
          :nodes="detail.licenseTreeNodes"
          initial-expand-mode="all"
          :selectable="false"
        />

        <h3 class="section-title section-title--conflicts">潜在许可证冲突</h3>
        <a-card :bordered="false" class="conflicts-card">
          <ul v-if="detail.licenseConflicts.length > 0" class="conflicts-list">
            <li v-for="(item, index) in detail.licenseConflicts" :key="index">
              {{ item }}
            </li>
          </ul>
          <a-empty v-else description="暂无潜在冲突" />
        </a-card>
      </template>
    </PageLoading>
  </a-drawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { getAiParseResultDetail } from '@/api/detect'
import type { AiParseResultDetail, AiParseTask } from '@/types/detect'
import PageLoading from '@/components/common/PageLoading.vue'
import LinuxStyleFileTree from '@/components/common/LinuxStyleFileTree.vue'
import AiParseCoverageBar from '@/components/detect/AiParseCoverageBar.vue'
import { formatAiParseFinishedAt } from '@/utils/aiParseDisplay'
import { formatDurationMs } from '@/utils/taskDisplay'

const props = defineProps<{
  /** 当前查看结果的解析任务 */
  task: AiParseTask | null
}>()

const visible = defineModel<boolean>('open', { required: true })

const loading = ref(false)
const detail = ref<AiParseResultDetail | null>(null)

/** 抽屉标题含解析对象名 */
const drawerTitle = computed(() => {
  if (!props.task) {
    return '解析结果'
  }
  return `解析结果 · ${props.task.parseObjectName}`
})

/** 顶栏完成时间展示文案 */
const finishedAtText = computed(() =>
  detail.value ? formatAiParseFinishedAt(detail.value.finishedAt) : '—',
)

const analysisModeLabel = computed(() =>
  detail.value?.analysisMode === 'ai_provider' ? 'AI + 规则复核' : '规则回退',
)

const analysisTagColor = computed(() =>
  detail.value?.analysisMode === 'ai_provider' ? 'processing' : 'warning',
)

const confidenceText = computed(() => {
  const confidence = detail.value?.confidence ?? 0
  return confidence > 0 ? `${(confidence * 100).toFixed(1)}%` : '—'
})

/** 抽屉打开且有关联任务时拉取解析结果详情 */
async function fetchDetail(parseTaskId: string) {
  loading.value = true
  detail.value = null
  try {
    const res = await getAiParseResultDetail(parseTaskId)
    detail.value = res.data
  } finally {
    loading.value = false
  }
}

watch(
  () => [visible.value, props.task?.parseTaskId] as const,
  ([open, parseTaskId]) => {
    if (open && parseTaskId) {
      fetchDetail(parseTaskId)
    }
    if (!open) {
      detail.value = null
    }
  },
)
</script>

<style scoped>
.ai-result-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.ai-result-head__left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ai-result-head__status {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.65);
}

.ai-result-head__meta {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.45);
}

.section-title {
  margin: 16px 0 12px;
  font-size: 16px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.88);
}

.fallback-alert {
  margin-bottom: 16px;
}

.section-title--conflicts {
  margin-top: 20px;
}

.conflicts-card {
  background: #fafafa;
}

.conflicts-list {
  margin: 0;
  padding-left: 20px;
  color: rgba(0, 0, 0, 0.65);
  font-size: 14px;
  line-height: 1.8;
}
</style>
