<template>
  <a-modal
    v-model:open="visible"
    title="删除模板"
    :confirm-loading="submitting"
    ok-text="确定"
    cancel-text="取消"
    ok-type="danger"
    destroy-on-close
    @ok="handleOk"
  >
    <p class="delete-hint">删除后不可恢复，是否继续？</p>
  </a-modal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { deleteReportTemplate } from '@/api/reportTemplate'
import type { ReportTemplate } from '@/types/reportTemplate'

const props = defineProps<{
  template: ReportTemplate
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
    await deleteReportTemplate(props.template.templateId)
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
