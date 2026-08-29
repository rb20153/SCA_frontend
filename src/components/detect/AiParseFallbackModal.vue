<template>
  <a-modal
    v-model:open="visible"
    title="规则解析回退"
    :confirm-loading="submitting"
    ok-text="确认回退并重新解析"
    cancel-text="取消"
    width="720px"
    destroy-on-close
    @ok="handleOk"
  >
    <a-alert
      type="info"
      show-icon
      class="fallback-alert"
      message="AI 解析失败或未得到可靠结论。对比规则解析结果，确认后将切换为规则模式并重新提交解析任务。"
    />

    <p v-if="task" class="parse-object-line">
      <span class="parse-object-label">解析对象：</span>{{ task.parseObjectName }}
    </p>

    <PageLoading :loading="loadingCompare">
      <ListTable
        :columns="compareColumns"
        :data-source="compareItems"
        :pagination="false"
        row-key="targetPath"
      />
    </PageLoading>

    <a-form layout="vertical" class="reason-form">
      <a-form-item label="回退原因" required>
        <a-select
          v-model:value="reason"
          placeholder="请选择"
          :options="AI_PARSE_FALLBACK_REASON_OPTIONS"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { TableColumnsType } from 'ant-design-vue'
import { message } from 'ant-design-vue'
import { getAiParseFallbackCompare, submitAiParseFallback } from '@/api/detect'
import ListTable from '@/components/common/ListTable.vue'
import PageLoading from '@/components/common/PageLoading.vue'
import type { AiParseFallbackCompareItem, AiParseFallbackReason, AiParseTask } from '@/types/detect'
import { AI_PARSE_FALLBACK_REASON_OPTIONS } from '@/utils/aiParseQuery'
import { usePagePermission } from '@/composables/usePagePermission'

const props = defineProps<{
  /** 待规则回退的失败任务 */
  task: AiParseTask | null
}>()

const visible = defineModel<boolean>('open', { required: true })
const { canWrite } = usePagePermission()

const emit = defineEmits<{
  success: []
}>()

const submitting = ref(false)
const loadingCompare = ref(false)
const compareItems = ref<AiParseFallbackCompareItem[]>([])
const reason = ref<AiParseFallbackReason | undefined>(undefined)

const compareColumns: TableColumnsType<AiParseFallbackCompareItem> = [
  { title: '对象', key: 'targetPath', dataIndex: 'targetPath', width: 128, ellipsis: true },
  { title: 'AI', key: 'aiResult', dataIndex: 'aiResult', width: 88 },
  { title: '规则', key: 'ruleResult', dataIndex: 'ruleResult', width: 320, ellipsis: true },
]

/** 拉取 AI vs 规则对比项 */
async function fetchCompareItems() {
  if (!props.task) {
    compareItems.value = []
    return
  }

  loadingCompare.value = true
  compareItems.value = []
  try {
    const res = await getAiParseFallbackCompare(props.task.parseTaskId)
    compareItems.value = res.data
  } finally {
    loadingCompare.value = false
  }
}

/** 校验原因后提交规则回退 */
async function handleOk() {
  if (!canWrite('/detect/ai-analysis')) return Promise.reject()
  if (!props.task) {
    return Promise.reject()
  }
  if (!reason.value) {
    message.warning('请选择回退原因')
    return Promise.reject()
  }

  submitting.value = true
  try {
    await submitAiParseFallback(props.task.parseTaskId, { reason: reason.value })
    message.success('已确认规则回退，解析任务重新提交')
    visible.value = false
    emit('success')
  } finally {
    submitting.value = false
  }
}

/** 重置表单 */
function resetForm() {
  reason.value = undefined
  compareItems.value = []
}

watch(
  () => [visible.value, props.task?.parseTaskId] as const,
  ([open]) => {
    if (open && props.task) {
      resetForm()
      void fetchCompareItems()
    }
    if (!open) {
      resetForm()
    }
  },
)
</script>

<style scoped>
.fallback-alert {
  margin-bottom: 16px;
}

.parse-object-line {
  margin: 0 0 16px;
  color: rgba(0, 0, 0, 0.88);
}

.parse-object-label {
  color: rgba(0, 0, 0, 0.45);
}

.reason-form {
  margin-top: 16px;
}
</style>
