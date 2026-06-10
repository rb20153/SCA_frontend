<template>
  <a-modal
    v-model:open="visible"
    title="取消发布"
    :confirm-loading="submitting"
    ok-text="确定"
    cancel-text="取消"
    destroy-on-close
    @ok="handleOk"
  >
    <p class="unpublish-hint">
      取消发布后模板将变为草稿状态，生成报告时将不可选择该模板，是否继续？
    </p>
  </a-modal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { unpublishReportTemplate } from '@/api/reportTemplate'
import type { ReportTemplate } from '@/types/reportTemplate'

const props = defineProps<{
  template: ReportTemplate
}>()

const visible = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  success: [template: ReportTemplate]
}>()

const submitting = ref(false)

/** 确认后调用取消发布 API */
async function handleOk() {
  submitting.value = true
  try {
    const res = await unpublishReportTemplate(props.template.templateId)
    visible.value = false
    emit('success', res.data)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.unpublish-hint {
  margin: 0;
  color: rgba(0, 0, 0, 0.88);
}
</style>
