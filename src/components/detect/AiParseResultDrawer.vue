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
      <a-alert v-if="error" type="error" show-icon message="解析结果加载失败" />
      <a-empty v-else-if="!loading && !detail" description="暂无解析结果" />

      <template v-else-if="detail">
        <div class="ai-result-head">
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

        <a-alert
          v-if="detail.provenanceStatus === 'legacy-unavailable'"
          type="warning"
          show-icon
          message="该任务为历史结果，暂无完整许可证取证快照，请重新解析后查看。"
          class="scope-alert"
        />
        <a-alert
          v-else-if="collectionLimitations.length"
          type="warning"
          show-icon
          message="取证范围存在限制"
          class="scope-alert"
        >
          <template #description>
            <ul class="limitation-list"><li v-for="item in collectionLimitations" :key="item">{{ item }}</li></ul>
          </template>
        </a-alert>

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

        <h3 class="section-title">AI 分析报告</h3>
        <ReportTemplateMarkdownPreview
          v-if="detail.reportMarkdown"
          :markdown-content="detail.reportMarkdown"
          :variables="[]"
          class="report-preview"
        />
        <a-empty v-else description="暂无 AI 分析报告" />

        <h3 class="section-title">许可证来源证据</h3>
        <a-collapse v-if="detail.licenseSources.length" class="source-collapse">
          <a-collapse-panel
            v-for="source in detail.licenseSources"
            :key="source.id || `${source.filePath}-${source.licenseId}`"
            :header="`${source.licenseId || '未识别许可证'} · ${source.filePath || '未知文件'}`"
          >
            <a-descriptions :column="1" bordered size="small">
              <a-descriptions-item label="来源类型">{{ source.sourceType || '—' }}</a-descriptions-item>
              <a-descriptions-item label="获取方式">{{ source.acquisitionType || '—' }}</a-descriptions-item>
              <a-descriptions-item label="组件">{{ source.component.name || '—' }} {{ source.component.version }}</a-descriptions-item>
              <a-descriptions-item label="依赖层级">{{ source.dependencyDepth == null ? '未知' : source.dependencyDepth }}</a-descriptions-item>
              <a-descriptions-item label="依赖路径">{{ source.dependencyPath.join(' → ') || '—' }}</a-descriptions-item>
              <a-descriptions-item label="证据行">{{ evidenceLineText(source) }}</a-descriptions-item>
              <a-descriptions-item label="证据摘要"><span class="break-text">{{ source.evidence.excerpt || '—' }}</span></a-descriptions-item>
              <a-descriptions-item label="SHA-256"><span class="break-text">{{ source.evidence.contentSha256 || '—' }}</span></a-descriptions-item>
              <a-descriptions-item label="实际读取">{{ source.evidence.contentAvailable ? '是' : '否' }}</a-descriptions-item>
            </a-descriptions>
          </a-collapse-panel>
        </a-collapse>
        <a-empty v-else description="暂无许可证来源证据" />
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
import ReportTemplateMarkdownPreview from '@/components/report/ReportTemplateMarkdownPreview.vue'
import { formatAiParseFinishedAt } from '@/utils/aiParseDisplay'
import { formatDurationMs } from '@/utils/taskDisplay'

const props = defineProps<{
  /** 当前查看结果的解析任务 */
  task: AiParseTask | null
}>()

const visible = defineModel<boolean>('open', { required: true })

const loading = ref(false)
const detail = ref<AiParseResultDetail | null>(null)
const error = ref(false)

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

const confidenceText = computed(() => {
  const confidence = detail.value?.confidence ?? 0
  return confidence > 0 ? `${(confidence * 100).toFixed(1)}%` : '—'
})

const collectionLimitations = computed(() => {
  const collection = detail.value?.evidenceCollection
  if (!collection) return []
  return [
    ...collection.dependenciesWithoutSourceFiles.map((item) => `缺少依赖源文件：${item}`),
    ...collection.excludedByDepth.map((item) => `超出扫描深度：${item}`),
    ...collection.unknownDependencyLevels.map((item) => `依赖层级未知：${item}`),
    ...collection.unsupportedManifests.map((item) => `暂不支持的清单：${item}`),
  ]
})

function evidenceLineText(source: AiParseResultDetail['licenseSources'][number]): string {
  const { startLine, endLine } = source.evidence
  if (startLine == null && endLine == null) return '—'
  return startLine === endLine || endLine == null ? `第 ${startLine} 行` : `第 ${startLine}-${endLine} 行`
}

/** 抽屉打开且有关联任务时拉取解析结果详情 */
async function fetchDetail(parseTaskId: string) {
  loading.value = true
  detail.value = null
  error.value = false
  try {
    const res = await getAiParseResultDetail(parseTaskId)
    detail.value = res.data
  } catch {
    error.value = true
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
      error.value = false
    }
  },
)
</script>

<style scoped>
.ai-result-head {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
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

.report-preview {
  height: 360px;
  min-height: 0;
}

.source-collapse {
  background: #fafafa;
}

.break-text {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.scope-alert {
  margin-top: 16px;
}

.limitation-list {
  margin: 0;
  padding-left: 18px;
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
