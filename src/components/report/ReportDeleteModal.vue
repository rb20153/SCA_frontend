<template>
  <a-modal
    v-model:open="visible"
    title="删除报告"
    :confirm-loading="submitting"
    ok-text="确定"
    cancel-text="取消"
    ok-type="danger"
    destroy-on-close
    @ok="handleOk"
  >
    <p class="delete-hint">删除后不可恢复，但不影响原始任务结果与证据链。</p>
  </a-modal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { deleteReport } from '@/api/report'
import type { Report } from '@/types/report'

const props = defineProps<{
  report: Report
}>()

const visible = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  success: []
}>()

const submitting = ref(false)

/** 确认后调用删除 API */
async function handleOk() {
  submitting.value = true
  try {
    await deleteReport(props.report.reportId)
    visible.value = false
    emit('success')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.delete-hint {
  margin: 0;
  color: rgba(0, 0, 0, 0.88);
}
</style>
