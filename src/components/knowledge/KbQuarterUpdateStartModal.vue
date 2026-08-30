<template>
  <a-modal
    v-model:open="visible"
    title="开始季度更新"
    ok-text="是"
    cancel-text="否"
    :confirm-loading="submitting"
    :mask-closable="!submitting"
    :closable="!submitting"
    @ok="handleOk"
  >
    <p class="start-tip">是否开始执行增量同步？</p>
  </a-modal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import { startKbQuarterUpdate } from '@/api/knowledge'
import { usePagePermission } from '@/composables/usePagePermission'

const visible = defineModel<boolean>('open', { required: true })
const { canWrite } = usePagePermission()

const emit = defineEmits<{
  success: []
}>()

const submitting = ref(false)

/** 提交季度增量同步请求，提交期间防止重复触发。 */
async function handleOk() {
  if (!canWrite('/knowledge/quarter-updates') || submitting.value) return

  submitting.value = true
  try {
    await startKbQuarterUpdate()
    message.success('操作成功')
    visible.value = false
    emit('success')
  } catch {
    // 请求层已展示失败原因，避免重复提示。
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.start-tip {
  margin: 0;
  color: rgba(0, 0, 0, 0.88);
  line-height: 1.6;
}
</style>
