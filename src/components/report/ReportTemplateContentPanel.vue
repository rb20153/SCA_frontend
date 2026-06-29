<template>
  <div class="template-content-panel">
    <a-card :bordered="false" class="template-content-panel__editor">
      <template #title>Markdown 模板编辑器</template>
      <ReportTemplateMarkdownEditor
        v-model:markdown-content="markdownContentModel"
        :variables="variables"
        :template-name="templateName"
        :readonly="props.readonly"
      />
    </a-card>

    <a-card :bordered="false" class="template-content-panel__preview">
      <template #title>实时预览</template>
      <ReportTemplateMarkdownPreview
        :markdown-content="markdownContentModel"
        :variables="variables"
      />
    </a-card>
  </div>
</template>

<script setup lang="ts">
import ReportTemplateMarkdownEditor from '@/components/report/ReportTemplateMarkdownEditor.vue'
import ReportTemplateMarkdownPreview from '@/components/report/ReportTemplateMarkdownPreview.vue'
import type { ReportTemplateVariable } from '@/types/reportTemplate'

const props = defineProps<{
  /** 变量库 */
  variables: ReportTemplateVariable[]
  /** 模板名称（导出文件名） */
  templateName: string
  /** 系统内置模板只读查看 */
  readonly?: boolean
}>()

const markdownContentModel = defineModel<string>('markdownContent', { required: true })
</script>

<style scoped>
.template-content-panel {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: 16px;
  align-items: stretch;
  min-height: 560px;
}

.template-content-panel__editor,
.template-content-panel__preview {
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.template-content-panel__editor :deep(.ant-card),
.template-content-panel__preview :deep(.ant-card) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.template-content-panel__editor :deep(.ant-card-body),
.template-content-panel__preview :deep(.ant-card-body) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding-top: 16px;
}
</style>
