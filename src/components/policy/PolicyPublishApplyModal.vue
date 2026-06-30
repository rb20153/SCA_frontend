<template>
  <a-modal
    v-model:open="visible"
    title="提交发布申请"
    :confirm-loading="submitting"
    ok-text="确定"
    cancel-text="取消"
    width="560px"
    destroy-on-close
    @ok="handleOk"
  >
    <a-form layout="vertical" class="publish-form">
      <a-form-item
        label="新版本号"
        required
        :validate-status="versionError ? 'error' : undefined"
        :help="versionError"
      >
        <a-input
          v-model:value="versionNo"
          placeholder="如 v2.4.1"
        />
        <p v-if="currentVersion" class="field-hint">
          当前生效版本为 {{ currentVersion }}，新版本号必须更大
        </p>
      </a-form-item>

      <a-form-item
        label="变更摘要"
        required
        :validate-status="summaryError ? 'error' : undefined"
        :help="summaryError"
      >
        <a-textarea
          v-model:value="changeSummary"
          :rows="4"
          placeholder="简述本次修改，供版本列表展示"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  isPolicyVersionGreaterThan,
  isValidPolicyVersionFormat,
} from '@/utils/policyVersionDisplay'

const props = defineProps<{
  /** 当前生效版本；新建策略时不传 */
  currentVersion?: string | null
  submitting?: boolean
}>()

const visible = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  submit: [payload: { versionNo: string; changeSummary: string }]
}>()

const versionNo = ref('')
const changeSummary = ref('')
const versionError = ref('')
const summaryError = ref('')

/** 弹窗打开时重置表单与校验状态 */
function resetForm() {
  versionNo.value = props.currentVersion
    ? suggestNextPolicyVersion(props.currentVersion)
    : 'v1.0.0'
  changeSummary.value = ''
  versionError.value = ''
  summaryError.value = ''
}

/**
 * 基于当前版本号生成建议的下一版本（末位 +1）
 * @param current - 当前生效版本号
 */
function suggestNextPolicyVersion(current: string): string {
  const normalized = current.trim().replace(/^[vV]/, '')
  const parts = normalized.split(/[.-]/)
  const lastIndex = parts.length - 1
  const lastPart = Number.parseInt(parts[lastIndex] ?? '0', 10)
  parts[lastIndex] = String(Number.isNaN(lastPart) ? 1 : lastPart + 1)
  return `v${parts.join('.')}`
}

/** 校验版本号与变更摘要 */
function validateForm(): boolean {
  versionError.value = ''
  summaryError.value = ''

  const trimmedVersion = versionNo.value.trim()
  const trimmedSummary = changeSummary.value.trim()

  if (!trimmedVersion) {
    versionError.value = '请填写版本号'
    return false
  }

  if (!isValidPolicyVersionFormat(trimmedVersion)) {
    versionError.value = '版本号格式不正确，示例：v2.4.1'
    return false
  }

  if (
    props.currentVersion &&
    !isPolicyVersionGreaterThan(trimmedVersion, props.currentVersion)
  ) {
    versionError.value = `版本号必须大于当前生效版本 ${props.currentVersion}`
    return false
  }

  if (!trimmedSummary) {
    summaryError.value = '请填写变更摘要'
    return false
  }

  return true
}

/** 校验通过后向父组件提交表单数据；阻止弹窗自动关闭，由父级在请求成功后关闭 */
function handleOk() {
  if (!validateForm()) {
    return Promise.reject()
  }

  emit('submit', {
    versionNo: versionNo.value.trim(),
    changeSummary: changeSummary.value.trim(),
  })
  return Promise.reject()
}

watch(
  () => visible.value,
  (open) => {
    if (open) {
      resetForm()
    }
  },
)

watch(versionNo, () => {
  if (versionError.value) {
    versionError.value = ''
  }
})

watch(changeSummary, () => {
  if (summaryError.value) {
    summaryError.value = ''
  }
})
</script>

<style scoped>
.publish-form {
  margin-top: 8px;
}

.field-hint {
  margin: 8px 0 0;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.45);
}
</style>
