<template>
  <a-modal
    v-model:open="visible"
    title="忽略组件"
    :confirm-loading="submitting"
    ok-text="确定"
    cancel-text="取消"
    destroy-on-close
    @ok="handleOk"
  >
    <p class="confirm-text">
      忽略后该组件将不再纳入当前项目的风险统计与报告，是否继续？
    </p>
    <p v-if="component" class="component-hint">
      组件：{{ component.componentName }}@{{ component.version }}
    </p>
    <a-form layout="vertical" class="reason-form">
      <a-form-item label="忽略原因" required>
        <a-select
          v-model:value="reason"
          placeholder="请选择"
          :options="RISK_COMPONENT_IGNORE_REASON_OPTIONS"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { ignoreOpenSourceRiskComponent } from '@/api/detect'
import type { OpenSourceRiskComponent, OpenSourceRiskComponentIgnoreReason } from '@/types/detect'
import { RISK_COMPONENT_IGNORE_REASON_OPTIONS } from '@/utils/openSourceRiskComponentQuery'
import { usePagePermission } from '@/composables/usePagePermission'

const props = defineProps<{
  /** 当前任务 ID */
  taskId: string
  /** 待忽略的组件；为空时不提交 */
  component: OpenSourceRiskComponent | null
}>()

const visible = defineModel<boolean>('open', { required: true })
const { canWrite } = usePagePermission()

const emit = defineEmits<{
  success: []
}>()

const submitting = ref(false)
const reason = ref<OpenSourceRiskComponentIgnoreReason | undefined>(undefined)

/** 弹窗关闭时清空已选原因 */
function resetForm() {
  reason.value = undefined
}

/** 校验原因后提交忽略请求 */
async function handleOk() {
  if (!canWrite('/detect/risk')) return Promise.reject()
  if (!props.component) {
    return Promise.reject()
  }
  if (!reason.value) {
    message.warning('请选择忽略原因')
    return Promise.reject()
  }

  submitting.value = true
  try {
    await ignoreOpenSourceRiskComponent(props.taskId, props.component.componentId, {
      reason: reason.value,
    })
    message.success('已忽略该组件')
    visible.value = false
    emit('success')
  } finally {
    submitting.value = false
  }
}

watch(visible, (open) => {
  if (!open) {
    resetForm()
  }
})
</script>

<style scoped>
.confirm-text {
  margin: 0 0 8px;
  color: rgba(0, 0, 0, 0.88);
}

.component-hint {
  margin: 0 0 16px;
  color: rgba(0, 0, 0, 0.45);
  font-size: 13px;
}

.reason-form {
  margin-top: 8px;
}
</style>
