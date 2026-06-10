<template>
  <a-modal
    v-model:open="visible"
    title="发布模板"
    :confirm-loading="submitting"
    ok-text="确定"
    cancel-text="取消"
    destroy-on-close
    @ok="handleOk"
  >
    <p class="publish-hint">是否发布{{ template.templateName }}为可选模板？</p>
  </a-modal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import { publishReportTemplate } from '@/api/reportTemplate'
import type { ReportTemplate } from '@/types/reportTemplate'

const props = defineProps<{
  template: ReportTemplate
}>()

const visible = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  success: [template: ReportTemplate]
}>()

const submitting = ref(false)

/** 确认后调用发布 API */
async function handleOk() {
  submitting.value = true
  try {
    const res = await publishReportTemplate(props.template.templateId)
    visible.value = false
    message.success('发布成功')
    emit('success', res.data)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.publish-hint {
  margin: 0;
  color: rgba(0, 0, 0, 0.88);
}
</style>
