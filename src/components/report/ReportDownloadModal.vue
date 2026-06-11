<template>
  <a-modal
    v-model:open="visible"
    title="下载报告"
    :confirm-loading="submitting"
    ok-text="确定"
    cancel-text="取消"
    destroy-on-close
    @ok="handleOk"
  >
    <a-alert type="info" show-icon class="report-download-policy-alert">
      <template #message>导出说明</template>
      <template #description>
        <div>策略：{{ exportPolicy.policyName }}</div>
        <div>
          导出脱敏：{{ exportPolicy.desensitizeRoleLabel }} · {{ exportPolicy.desensitizeLevel }}
          （按当前登录角色自动应用）
        </div>
        <div>水印：{{ exportPolicy.watermarkPreview }}</div>
      </template>
    </a-alert>

    <a-form :model="formState" layout="vertical" class="report-download-form">
      <a-form-item label="下载格式" name="format">
        <a-select
          v-model:value="formState.format"
          :options="REPORT_DOWNLOAD_FORMAT_OPTIONS"
          class="report-download-format"
        />
      </a-form-item>

      <a-form-item label="包含证据链" name="includeEvidenceChain">
        <a-select
          v-model:value="formState.includeEvidenceChain"
          :options="evidenceChainOptions"
          class="report-download-evidence"
        />
      </a-form-item>
    </a-form>

    <p class="report-download-hint">含证据链时将打包为 ZIP；仅正文时按所选格式导出。</p>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { createReportDownload } from '@/api/report'
import type { Report, ReportExportPolicyPreview } from '@/types/report'
import {
  DEFAULT_REPORT_DOWNLOAD_FORMAT,
  REPORT_DOWNLOAD_FORMAT_OPTIONS,
  REPORT_EVIDENCE_CHAIN_OPTIONS,
} from '@/utils/reportDownloadDisplay'
import { triggerReportDownload } from '@/utils/reportDownload'

const props = defineProps<{
  report: Report
  exportPolicy: ReportExportPolicyPreview
}>()

const visible = defineModel<boolean>('open', { required: true })

const submitting = ref(false)

const formState = reactive({
  format: DEFAULT_REPORT_DOWNLOAD_FORMAT,
  includeEvidenceChain: false,
})

const evidenceChainOptions = computed(() =>
  REPORT_EVIDENCE_CHAIN_OPTIONS.map((item) => ({
    label: item.label,
    value: item.value,
  })),
)

/** 重置下载表单为默认值 */
function resetForm() {
  formState.format = DEFAULT_REPORT_DOWNLOAD_FORMAT
  formState.includeEvidenceChain = false
}

/** 提交下载请求并触发浏览器下载 */
async function handleOk() {
  submitting.value = true
  try {
    const res = await createReportDownload(props.report.reportId, {
      format: formState.format,
      includeEvidenceChain: formState.includeEvidenceChain,
    })
    triggerReportDownload(res.data.url, res.data.fileName)
    message.success('已开始下载')
    visible.value = false
  } catch {
    message.error('获取下载链接失败')
    return Promise.reject()
  } finally {
    submitting.value = false
  }
}

watch(
  () => visible.value,
  (open) => {
    if (open) {
      resetForm()
    }
  },
)
</script>

<style scoped>
.report-download-policy-alert {
  margin-bottom: 16px;
}

.report-download-form {
  margin-top: 4px;
}

.report-download-format,
.report-download-evidence {
  width: 200px;
}

.report-download-hint {
  margin: 0;
  color: rgba(0, 0, 0, 0.45);
  font-size: 13px;
}
</style>
