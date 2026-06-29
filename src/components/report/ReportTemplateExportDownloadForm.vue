<template>
    <a-form
      ref="formRef"
      :model="exportSettings"
      layout="vertical"
      class="export-download-form"
    >
    <a-form-item label="允许格式">
      <a-checkbox-group
        v-model:value="allowedFormatsValue"
        :options="REPORT_TEMPLATE_ALLOWED_FORMAT_OPTIONS"
        :disabled="props.readonly"
      />
    </a-form-item>

    <a-form-item label="导出需审批">
      <a-select
        v-model:value="exportRequiresApprovalValue"
        :options="REPORT_TEMPLATE_EXPORT_APPROVAL_OPTIONS"
        class="export-download-form__select"
        :disabled="props.readonly"
      />
    </a-form-item>

    <a-form-item label="水印">
      <a-select
        v-model:value="watermarkEnabledValue"
        :options="REPORT_TEMPLATE_WATERMARK_OPTIONS"
        class="export-download-form__select"
        :disabled="props.readonly"
      />
    </a-form-item>

    <a-form-item
      v-if="exportSettings.watermarkEnabled"
      label="水印内容"
      name="watermarkContent"
      required
      :rules="watermarkContentRules"
    >
      <a-input
        v-model:value="exportSettings.watermarkContent"
        placeholder="请输入水印内容"
        allow-clear
        :disabled="props.readonly"
      />
    </a-form-item>

    <a-form-item label="谁可下载">
      <a-select
        v-model:value="exportSettings.downloadScope"
        :options="REPORT_TEMPLATE_DOWNLOAD_SCOPE_OPTIONS"
        class="export-download-form__select"
        :disabled="props.readonly"
      />
    </a-form-item>

    <a-form-item label="链接有效期">
      <a-select
        v-model:value="exportSettings.linkValidity"
        :options="REPORT_TEMPLATE_LINK_VALIDITY_OPTIONS"
        class="export-download-form__select"
        :disabled="props.readonly"
      />
    </a-form-item>

    <a-form-item label="下载审计">
      <div class="export-download-form__audit">
        <a-checkbox v-model:checked="exportSettings.auditDownloadUser" :disabled="props.readonly">
          记录下载人
        </a-checkbox>
        <a-checkbox v-model:checked="exportSettings.auditDownloadIp" :disabled="props.readonly">
          记录 IP
        </a-checkbox>
      </div>
    </a-form-item>
  </a-form>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { FormInstance } from 'ant-design-vue'
import type { Rule } from 'ant-design-vue/es/form'
import type {
  ReportTemplateDownloadFormat,
  ReportTemplateExportSettings,
} from '@/types/reportTemplate'
import {
  REPORT_TEMPLATE_ALLOWED_FORMAT_OPTIONS,
  REPORT_TEMPLATE_DOWNLOAD_SCOPE_OPTIONS,
  REPORT_TEMPLATE_EXPORT_APPROVAL_OPTIONS,
  REPORT_TEMPLATE_LINK_VALIDITY_OPTIONS,
  REPORT_TEMPLATE_WATERMARK_OPTIONS,
} from '@/utils/reportTemplateExportDisplay'

const props = defineProps<{
  /** 系统内置模板只读查看 */
  readonly?: boolean
}>()

const exportSettings = defineModel<ReportTemplateExportSettings>({ required: true })

const formRef = ref<FormInstance | null>(null)

/** 水印开启时水印内容必填 */
const watermarkContentRules = computed<Rule[]>(() => [
  {
    required: true,
    whitespace: true,
    message: '请输入水印内容',
  },
])

/** 允许格式多选与 typed 数组互转 */
const allowedFormatsValue = computed({
  get() {
    return exportSettings.value.allowedFormats as string[]
  },
  set(value: string[]) {
    exportSettings.value.allowedFormats = value as ReportTemplateDownloadFormat[]
  },
})

/** 导出需审批布尔值与下拉 string 互转 */
const exportRequiresApprovalValue = computed({
  get() {
    return exportSettings.value.exportRequiresApproval ? 'true' : 'false'
  },
  set(value: string) {
    exportSettings.value.exportRequiresApproval = value === 'true'
  },
})

/** 水印开关布尔值与下拉 string 互转 */
const watermarkEnabledValue = computed({
  get() {
    return exportSettings.value.watermarkEnabled ? 'true' : 'false'
  },
  set(value: string) {
    exportSettings.value.watermarkEnabled = value === 'true'
    if (value === 'true') {
      void formRef.value?.validateFields(['watermarkContent']).catch(() => undefined)
    } else {
      formRef.value?.clearValidate(['watermarkContent'])
    }
  },
})

/** 校验下载与水印表单（保存模板时调用） */
async function validateExportDownloadForm(): Promise<boolean> {
  if (!exportSettings.value.watermarkEnabled) {
    return true
  }
  try {
    await formRef.value?.validateFields(['watermarkContent'])
    return true
  } catch {
    return false
  }
}

defineExpose({
  validateExportDownloadForm,
})
</script>

<style scoped>
.export-download-form {
  flex: 1;
  min-height: 0;
}

.export-download-form__select {
  width: 100%;
}

.export-download-form__audit {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 24px;
}
</style>
