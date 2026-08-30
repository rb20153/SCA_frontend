<template>
  <a-modal v-model:open="visible" title="提交报告下载申请" ok-text="提交申请" cancel-text="取消" :confirm-loading="submitting" destroy-on-close @ok="handleOk">
    <a-form layout="vertical">
      <a-form-item label="申请原因" required>
        <a-textarea v-model:value="form.reason" :rows="4" :maxlength="200" show-count placeholder="请输入下载报告的业务原因" />
      </a-form-item>
      <a-form-item label="下载格式">
        <a-select v-model:value="form.format" :options="REPORT_DOWNLOAD_FORMAT_OPTIONS" />
      </a-form-item>
      <a-form-item label="包含证据链">
        <a-switch v-model:checked="form.includeEvidenceChain" checked-children="是" un-checked-children="否" />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { submitReportDownloadApplication } from '@/api/report'
import type { Report, ReportDownloadFormat } from '@/types/report'
import { REPORT_DOWNLOAD_FORMAT_OPTIONS } from '@/utils/reportDownloadDisplay'
const props = defineProps<{ report: Report | null }>()
const visible = defineModel<boolean>('open', { required: true })
const emit = defineEmits<{ success: [] }>()
const submitting = ref(false)
const form = reactive<{ reason: string; format: ReportDownloadFormat; includeEvidenceChain: boolean }>({ reason: '', format: 'pdf', includeEvidenceChain: false })
function reset() { form.reason = ''; form.format = 'pdf'; form.includeEvidenceChain = false }
async function handleOk() {
  if (!props.report) return Promise.reject()
  if (!form.reason.trim()) { message.warning('请输入申请原因'); return Promise.reject() }
  submitting.value = true
  try {
    await submitReportDownloadApplication(props.report.reportId, { reason: form.reason.trim(), format: form.format, includeEvidenceChain: form.includeEvidenceChain })
    message.success('已提交下载申请'); visible.value = false; emit('success')
  } catch (error) { message.error(error instanceof Error ? error.message : '提交申请失败'); return Promise.reject() }
  finally { submitting.value = false }
}
watch(() => visible.value, (open) => { if (open) reset() })
</script>
