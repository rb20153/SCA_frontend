<template>
  <div class="template-export-panel">
    <a-card :bordered="false" class="template-export-panel__card">
      <template #title>按角色脱敏（本模板）</template>
      <p class="template-export-panel__hint">
        默认继承平台策略；项目负责人可为本模板微调。
      </p>

      <ReportTemplateRoleDesensitizeTable :rules="exportSettings.roleRules" />

      <div class="template-export-panel__section">
        <div class="template-export-panel__section-title">敏感字段</div>
        <a-checkbox-group
          v-model:value="sensitiveFieldsValue"
          :options="REPORT_TEMPLATE_SENSITIVE_FIELD_OPTIONS"
          :disabled="props.readonly"
        />
      </div>
    </a-card>

    <a-card :bordered="false" class="template-export-panel__card">
      <template #title>下载与水印</template>
      <ReportTemplateExportDownloadForm
        ref="downloadFormRef"
        v-model="exportSettings"
        :readonly="props.readonly"
      />
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import ReportTemplateExportDownloadForm from '@/components/report/ReportTemplateExportDownloadForm.vue'
import ReportTemplateRoleDesensitizeTable from '@/components/report/ReportTemplateRoleDesensitizeTable.vue'
import type {
  ReportTemplateExportSettings,
  ReportTemplateSensitiveField,
} from '@/types/reportTemplate'
import { REPORT_TEMPLATE_SENSITIVE_FIELD_OPTIONS } from '@/utils/reportTemplateExportDisplay'

const props = defineProps<{
  /** 系统内置模板只读查看 */
  readonly?: boolean
}>()

const exportSettings = defineModel<ReportTemplateExportSettings>({ required: true })

const downloadFormRef = ref<InstanceType<typeof ReportTemplateExportDownloadForm> | null>(null)

/** 校验导出与权限表单（保存模板时调用） */
async function validateExportSettings(): Promise<boolean> {
  return (await downloadFormRef.value?.validateExportDownloadForm()) ?? true
}

defineExpose({
  validateExportSettings,
})

/** 敏感字段多选与 typed 数组互转 */
const sensitiveFieldsValue = computed({
  get() {
    return exportSettings.value.sensitiveFields as string[]
  },
  set(value: string[]) {
    exportSettings.value.sensitiveFields = value as ReportTemplateSensitiveField[]
  },
})
</script>

<style scoped>
.template-export-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px;
  align-items: stretch;
}

.template-export-panel__card {
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.template-export-panel__card :deep(.ant-card-body) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.template-export-panel__hint {
  margin: 0 0 16px;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.45);
  line-height: 1.6;
}

.template-export-panel__section {
  margin-top: 24px;
}

.template-export-panel__section-title {
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.88);
}
</style>
