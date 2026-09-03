<template>
  <div class="markdown-preview-panel">
    <div
      v-if="previewHtml"
      class="markdown-preview-panel__body"
      v-html="previewHtml"
    />
    <a-empty
      v-else
      class="markdown-preview-panel__empty"
      description="暂无预览内容"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ReportTemplateVariable } from '@/types/reportTemplate'
import { renderReportTemplateMarkdownPreview } from '@/utils/reportTemplateMarkdown'

const props = defineProps<{
  /** Markdown 正文 */
  markdownContent: string
  /** 变量库（用于占位符中文展示） */
  variables: ReportTemplateVariable[]
}>()

/** 实时渲染预览 HTML */
const previewHtml = computed(() => {
  if (!props.markdownContent.trim()) {
    return ''
  }
  return renderReportTemplateMarkdownPreview(props.markdownContent, props.variables)
})
</script>

<style scoped>
.markdown-preview-panel {
  flex: 1;
  min-height: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.markdown-preview-panel__empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 280px;
}

.markdown-preview-panel__body {
  flex: 1;
  min-height: 280px;
  height: 100%;
  padding: 16px;
  line-height: 1.8;
  background: linear-gradient(180deg, #ffffff 0%, #fcfcfc 100%);
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  overflow: auto;
}

.markdown-preview-panel__body :deep(h1),
.markdown-preview-panel__body :deep(h2),
.markdown-preview-panel__body :deep(h3) {
  margin: 0 0 12px;
  line-height: 1.4;
}

.markdown-preview-panel__body :deep(h1) {
  font-size: 24px;
}

.markdown-preview-panel__body :deep(h2) {
  font-size: 18px;
  margin-top: 20px;
}

.markdown-preview-panel__body :deep(h3) {
  font-size: 16px;
  margin-top: 16px;
}

.markdown-preview-panel__body :deep(p),
.markdown-preview-panel__body :deep(blockquote),
.markdown-preview-panel__body :deep(ul),
.markdown-preview-panel__body :deep(ol),
.markdown-preview-panel__body :deep(pre) {
  margin: 0 0 12px;
}

.markdown-preview-panel__body :deep(ul),
.markdown-preview-panel__body :deep(ol) {
  padding-left: 24px;
}

.markdown-preview-panel__body :deep(blockquote) {
  padding: 8px 12px;
  border-left: 3px solid #1677ff;
  background: #fafafa;
  color: rgba(0, 0, 0, 0.65);
}

.markdown-preview-panel__body :deep(code) {
  padding: 2px 6px;
  border-radius: 4px;
  background: #f5f5f5;
  font-family: Consolas, 'Courier New', monospace;
}

.markdown-preview-panel__body :deep(pre) {
  padding: 12px;
  border-radius: 8px;
  background: #f5f5f5;
  overflow: auto;
}

.markdown-preview-panel__body :deep(pre code) {
  padding: 0;
  background: transparent;
}

.markdown-preview-panel__body :deep(hr) {
  margin: 16px 0;
  border: none;
  border-top: 1px solid #f0f0f0;
}

.markdown-preview-panel__body :deep(.report-markdown-table-wrap) {
  margin: 16px 0;
  overflow-x: auto;
}

.markdown-preview-panel__body :deep(table) {
  width: 100%;
  min-width: 560px;
  border-collapse: collapse;
  font-size: 13px;
  line-height: 1.6;
}

.markdown-preview-panel__body :deep(th),
.markdown-preview-panel__body :deep(td) {
  padding: 8px 10px;
  border: 1px solid #d9d9d9;
  text-align: left;
  vertical-align: top;
  overflow-wrap: anywhere;
}

.markdown-preview-panel__body :deep(th) {
  background: #f5f5f5;
  font-weight: 600;
}

.markdown-preview-panel__body :deep(a) {
  color: #1677ff;
}

.markdown-preview-panel__body :deep(.report-template-variable) {
  display: inline-flex;
  align-items: center;
  padding: 1px 8px;
  border-radius: 999px;
  background: #e6f4ff;
  color: #1677ff;
  font-size: 12px;
}
</style>
