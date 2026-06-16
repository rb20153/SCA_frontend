<template>
  <a-modal
    v-model:open="visible"
    title="撤销忽略"
    :confirm-loading="submitting"
    ok-text="确定"
    cancel-text="取消"
    destroy-on-close
    @ok="handleOk"
  >
    <p class="confirm-text">是否撤销忽略？撤销后该组件将重新纳入当前项目的风险统计与报告。</p>
    <p v-if="component" class="component-hint">
      组件：{{ component.componentName }}@{{ component.version }}
    </p>
  </a-modal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import { revokeOpenSourceRiskComponentIgnore } from '@/api/detect'
import type { OpenSourceRiskComponent } from '@/types/detect'

const props = defineProps<{
  /** 当前任务 ID */
  taskId: string
  /** 待撤销忽略的组件 */
  component: OpenSourceRiskComponent | null
}>()

const visible = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  success: []
}>()

const submitting = ref(false)

/** 确认后提交撤销忽略请求 */
async function handleOk() {
  if (!props.component) {
    return Promise.reject()
  }

  submitting.value = true
  try {
    await revokeOpenSourceRiskComponentIgnore(props.taskId, props.component.componentId)
    message.success('已撤销忽略')
    visible.value = false
    emit('success')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.confirm-text {
  margin: 0 0 8px;
  color: rgba(0, 0, 0, 0.88);
}

.component-hint {
  margin: 0;
  color: rgba(0, 0, 0, 0.45);
  font-size: 13px;
}
</style>
