<template>
  <a-drawer
    v-model:open="visible"
    :title="drawerTitle"
    placement="right"
    :width="760"
    destroy-on-close
    :footer="null"
    class="ai-report-drawer"
  >
    <PageLoading :loading="loading && !detail">
      <a-alert v-if="error" type="error" show-icon message="AI 分析报告加载失败" />
      <a-empty v-else-if="!loading && !detail" description="暂无 AI 分析报告" />
      <div v-else-if="detail" class="ai-report-drawer__content">
        <div class="ai-report-drawer__meta">
          <span>{{ detail.parseObjectName || props.task?.parseObjectName || '解析对象' }}</span>
          <span>扫描深度：{{ detail.scanDepth }}</span>
          <span>置信度：{{ confidenceText }}</span>
        </div>
        <ReportTemplateMarkdownPreview
          v-if="detail.reportMarkdown"
          :markdown-content="detail.reportMarkdown"
          :variables="[]"
          class="ai-report-drawer__preview"
        />
        <a-empty v-else description="暂无 AI 分析报告" />
      </div>
    </PageLoading>
  </a-drawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getAiParseResultDetail } from '@/api/detect'
import PageLoading from '@/components/common/PageLoading.vue'
import ReportTemplateMarkdownPreview from '@/components/report/ReportTemplateMarkdownPreview.vue'
import type { AiParseResultDetail, AiParseTask } from '@/types/detect'

const props = defineProps<{
  task: AiParseTask | null
}>()

const visible = defineModel<boolean>('open', { required: true })
const loading = ref(false)
const error = ref(false)
const detail = ref<AiParseResultDetail | null>(null)
let requestSequence = 0

const drawerTitle = computed(() => `AI 分析报告 · ${props.task?.parseObjectName || '解析对象'}`)
const confidenceText = computed(() => {
  const confidence = detail.value?.confidence ?? 0
  return confidence > 0 ? `${(confidence * 100).toFixed(1)}%` : '—'
})

async function fetchDetail(parseTaskId: string) {
  const requestId = ++requestSequence
  loading.value = true
  error.value = false
  detail.value = null
  try {
    const res = await getAiParseResultDetail(parseTaskId)
    if (requestId === requestSequence) {
      detail.value = res.data
    }
  } catch {
    if (requestId === requestSequence) {
      error.value = true
    }
  } finally {
    if (requestId === requestSequence) {
      loading.value = false
    }
  }
}

watch(
  () => [visible.value, props.task?.parseTaskId] as const,
  ([open, parseTaskId]) => {
    if (open && parseTaskId) {
      void fetchDetail(parseTaskId)
    }
    if (!open) {
      requestSequence += 1
      detail.value = null
      error.value = false
    }
  },
)
</script>

<style scoped>
.ai-report-drawer :deep(.ant-drawer-body) {
  display: flex;
  min-height: 0;
  flex-direction: column;
  padding: 0 24px 24px;
}

.ai-report-drawer :deep(.page-loading__body),
.ai-report-drawer :deep(.ant-spin-nested-loading),
.ai-report-drawer :deep(.ant-spin-container) {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
}

.ai-report-drawer__content {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: 12px;
}

.ai-report-drawer__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  flex-shrink: 0;
  color: rgba(0, 0, 0, 0.65);
  font-size: 13px;
}

.ai-report-drawer__preview {
  min-height: 0;
  flex: 1;
}
</style>
