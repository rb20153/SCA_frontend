<template>
  <a-drawer
    v-model:open="visible"
    title="命中追溯详情"
    placement="right"
    :width="720"
    destroy-on-close
  >
    <PageLoading :loading="loading">
      <template v-if="detail">
        <a-descriptions :column="2" bordered size="small" class="hit-desc detail-desc">
          <a-descriptions-item label="任务名称">
            <DetailText :text="detail.taskName" />
          </a-descriptions-item>
          <a-descriptions-item label="项目名称">
            <DetailText :text="detail.projectName" />
          </a-descriptions-item>
          <a-descriptions-item label="规则">
            <DetailText :text="detail.ruleKeyword" />
          </a-descriptions-item>
          <a-descriptions-item label="命中对象">
            <DetailText :text="detail.hitObject" />
          </a-descriptions-item>
          <a-descriptions-item label="责任人">
            <DetailText :text="detail.responsibleUser" />
          </a-descriptions-item>
          <a-descriptions-item label="脱敏动作">
            <a-tag :color="POLICY_MASKING_ACTION_COLOR[detail.maskingAction]">
              {{ POLICY_MASKING_ACTION_LABEL[detail.maskingAction] }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="TraceID" :span="2">
            <router-link :to="buildLogListTracePath(detail.traceId)" class="list-table-link">
              {{ detail.traceId }}
            </router-link>
          </a-descriptions-item>
          <a-descriptions-item label="命中片段" :span="2">
            <CodeSnippetBlock :content="detail.hitSnippet" />
          </a-descriptions-item>
          <a-descriptions-item label="处置建议">
            <DetailText :text="detail.suggestion" />
          </a-descriptions-item>
          <a-descriptions-item label="处理结果">
            <DetailText :text="detail.processingResult" />
          </a-descriptions-item>
          <a-descriptions-item label="篡改分析" :span="2">
            <DetailText :text="detail.tamperAnalysis" />
          </a-descriptions-item>
        </a-descriptions>
      </template>
    </PageLoading>
  </a-drawer>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { getPolicyRuleHitDetail } from '@/api/policy'
import CodeSnippetBlock from '@/components/common/CodeSnippetBlock.vue'
import DetailText from '@/components/common/DetailText.vue'
import PageLoading from '@/components/common/PageLoading.vue'
import type { PolicyRuleHitDetail } from '@/types/policy'
import {
  POLICY_MASKING_ACTION_COLOR,
  POLICY_MASKING_ACTION_LABEL,
  buildLogListTracePath,
} from '@/utils/policyDisplay'

const props = defineProps<{
  hitId: string | null
}>()

const visible = defineModel<boolean>('open', { required: true })

const loading = ref(false)
const detail = ref<PolicyRuleHitDetail | null>(null)

/** 打开抽屉时按 ID 拉取命中追溯详情 */
async function fetchDetail(hitId: string) {
  loading.value = true
  detail.value = null
  try {
    const res = await getPolicyRuleHitDetail(hitId)
    detail.value = res.data
  } finally {
    loading.value = false
  }
}

watch(
  () => [visible.value, props.hitId] as const,
  ([open, hitId]) => {
    if (open && hitId) {
      fetchDetail(hitId)
    }
    if (!open) {
      detail.value = null
    }
  },
)
</script>

<style scoped>
.hit-desc {
  margin-bottom: 0;
}

.detail-desc :deep(.ant-descriptions-item-content) {
  word-break: break-word;
  overflow-wrap: anywhere;
}
</style>
