<template>
  <a-modal
    v-model:open="visible"
    title="处理告警"
    :confirm-loading="submitting"
    ok-text="确定"
    cancel-text="取消"
    width="720px"
    destroy-on-close
    @ok="handleSubmit"
  >
    <a-card size="small" class="alert-suggestion-card">
      <template #title>处理建议</template>
      <a-spin :spinning="suggestionsLoading">
        <ul v-if="suggestions.length > 0" class="suggestion-list">
          <li v-for="(suggestion, index) in suggestions" :key="index">
            {{ suggestion }}
          </li>
        </ul>
        <a-alert
          v-else-if="suggestionsLoadFailed"
          type="warning"
          show-icon
          message="处理建议加载失败，可继续提交处置"
        />
        <a-empty v-else description="暂无处理建议" />
      </a-spin>
    </a-card>

    <a-form layout="vertical" class="alert-handle-form">
      <a-row :gutter="16" align="top">
        <a-col :xs="24" :sm="8">
          <a-form-item label="处理方式" required>
            <a-select
              v-model:value="disposition"
              placeholder="请选择处理方式"
              :options="dispositionOptions"
              class="modal-select-full"
            />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="16">
          <a-form-item :label="remarkLabel" :required="isAlertRemarkRequired(disposition)">
            <a-textarea
              v-model:value="remark"
              :rows="3"
              :placeholder="remarkPlaceholder"
            />
          </a-form-item>
        </a-col>
      </a-row>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { getAlertDetail, handleAlert } from '@/api/system'
import type { AlertDisposition, AlertListItem } from '@/types/system'
import { ALERT_DISPOSITION } from '@/types/system'
import {
  ALERT_DISPOSITION_OPTIONS,
  isAlertRemarkRequired,
} from '@/utils/alertDisposition'
import { usePagePermission } from '@/composables/usePagePermission'

const visible = defineModel<boolean>('open', { required: true })

const props = defineProps<{
  alert: AlertListItem | null
}>()

const emit = defineEmits<{
  success: [movedToHandled: boolean]
}>()

const { canWrite } = usePagePermission()
const submitting = ref(false)
const disposition = ref<AlertDisposition>(ALERT_DISPOSITION.ManualFix)
const remark = ref('')
const suggestions = ref<string[]>([])
const suggestionsLoading = ref(false)
const suggestionsLoadFailed = ref(false)
let suggestionsRequestId = 0

const dispositionOptions = ALERT_DISPOSITION_OPTIONS.map((item) => ({
  value: item.value,
  label: item.label,
}))

const remarkLabel = computed(() => {
  if (disposition.value === ALERT_DISPOSITION.AutoRecover) return '处理备注'
  if (disposition.value === ALERT_DISPOSITION.Close) return '关闭原因'
  return '处理说明'
})

const remarkPlaceholder = computed(() => {
  if (disposition.value === ALERT_DISPOSITION.AutoRecover) return '可选：补充自动恢复备注'
  if (disposition.value === ALERT_DISPOSITION.Close) return '请填写关闭告警的原因'
  return '请填写人工修复内容和验证结果'
})

/** 打开弹窗时重置表单并加载处理建议。 */
async function initForm() {
  disposition.value = ALERT_DISPOSITION.ManualFix
  remark.value = ''
  suggestions.value = []
  suggestionsLoadFailed.value = false

  if (!props.alert) return

  const requestId = ++suggestionsRequestId
  suggestionsLoading.value = true
  try {
    const res = await getAlertDetail(props.alert.alertId)
    if (requestId === suggestionsRequestId) {
      suggestions.value = res.data.suggestions
    }
  } catch {
    if (requestId === suggestionsRequestId) {
      suggestionsLoadFailed.value = true
    }
  } finally {
    if (requestId === suggestionsRequestId) {
      suggestionsLoading.value = false
    }
  }
}

/** 切换处置方式时清空上一种处置方式的备注。 */
watch(disposition, (next, previous) => {
  if (next !== previous) {
    remark.value = ''
  }
})

/** 校验并提交处置请求 */
async function handleSubmit() {
  if (!canWrite('/system/alerts')) return Promise.reject()
  if (!props.alert) {
    return Promise.reject()
  }
  if (!disposition.value) {
    message.warning('请选择处理方式')
    return Promise.reject()
  }
  if (isAlertRemarkRequired(disposition.value) && !remark.value.trim()) {
    message.warning(
      disposition.value === ALERT_DISPOSITION.Close
        ? '请填写关闭原因'
        : '请填写处理说明',
    )
    return Promise.reject()
  }
  submitting.value = true
  try {
    const res = await handleAlert(
      props.alert.alertId,
      {
        disposition: disposition.value,
        remark: remark.value.trim() || undefined,
      },
    )
    if (res.data.executionStatus === 'failed') {
      message.error('自动恢复执行失败，请根据后端返回的失败原因处理')
      return
    }
    if (res.data.executionStatus === 'processing' || res.data.executionStatus === 'accepted') {
      message.success('自动恢复已受理，当前仍保留在未处理列表')
    } else if (res.data.movedToHandled) {
      message.success('告警处置已提交')
    } else {
      message.success('告警处置已提交，当前仍保留在未处理列表')
    }
    visible.value = false
    emit('success', res.data.movedToHandled)
  } finally {
    submitting.value = false
  }
}

watch(
  () => [visible.value, props.alert?.alertId] as const,
  ([open]) => {
    if (open) {
      void initForm()
    }
  },
)
</script>

<style scoped>
.alert-handle-form {
  margin-top: 8px;
}

.alert-suggestion-card {
  margin-bottom: 16px;
}

.suggestion-list {
  margin: 0;
  padding-left: 20px;
  color: rgba(0, 0, 0, 0.65);
}

.suggestion-list li + li {
  margin-top: 8px;
}

.modal-select-full {
  width: 100%;
}
</style>
