<template>
  <div class="markdown-editor">
    <a-alert type="info" show-icon class="markdown-editor__hint">
      <template #message>
        <ul class="markdown-editor__hint-list">
          <li>使用 <strong># / ## / ###</strong> 定义标题层级。</li>
          <li>使用 <strong>-</strong> 或 <strong>1.</strong> 定义列表。</li>
          <li>使用 <strong>**加粗**</strong>、<strong>`代码`</strong> 和 <strong>&gt; 引用</strong> 组织重点内容。</li>
          <li>
            变量占位符使用 <strong>$中文变量名</strong>（如 <strong>$项目名称</strong>），预览区以中文变量名示意，实际值由后端在生成报告时填充。
          </li>
        </ul>
      </template>
    </a-alert>

    <div class="markdown-editor__variables">
      <div class="markdown-editor__variables-title">变量库</div>
      <p class="markdown-editor__variables-desc">
        {{ props.readonly ? '变量占位符示意' : '点击标签插入变量' }}
      </p>
      <div class="markdown-editor__variable-tags">
        <a-tag
          v-for="item in variables"
          :key="item.varKey"
          class="markdown-editor__variable-tag"
          :class="{ 'markdown-editor__variable-tag--readonly': props.readonly }"
          @click="!props.readonly && handleInsertVariable(item)"
        >
          {{ item.varLabel }}
        </a-tag>
      </div>
    </div>

    <div class="markdown-editor__workspace">
      <a-textarea
        ref="textareaRef"
        v-model:value="markdownContent"
        class="markdown-editor__textarea"
        placeholder="在此编写 Markdown 模板…"
        :readonly="props.readonly"
        @keydown="handleTextareaKeydown"
      />
    </div>

    <div v-if="!props.readonly" class="markdown-editor__footer">
      <a-button @click="handleExportMarkdown">导出 Markdown</a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { message } from 'ant-design-vue'
import type { ReportTemplateVariable } from '@/types/reportTemplate'
import {
  downloadMarkdownFile,
  formatReportTemplateVariableToken,
  insertTextAtSelection,
  resolveVariableTokenDeleteRange,
  sanitizeReportTemplateMarkdownFileName,
} from '@/utils/reportTemplateMarkdown'

const props = defineProps<{
  /** 变量库（英文键 + 中文名，展示中文） */
  variables: ReportTemplateVariable[]
  /** 模板名称，用于导出文件名 */
  templateName: string
  /** 系统内置模板只读查看 */
  readonly?: boolean
}>()

const markdownContent = defineModel<string>('markdownContent', { required: true })

const textareaRef = ref<{
  resizableTextArea?: { textArea: HTMLTextAreaElement }
  $el?: HTMLElement
} | null>(null)

/** 解析 a-textarea 内部原生 textarea */
function resolveTextareaElement(): HTMLTextAreaElement | null {
  const refValue = textareaRef.value
  if (!refValue) {
    return null
  }
  if (refValue.resizableTextArea?.textArea) {
    return refValue.resizableTextArea.textArea
  }
  return refValue.$el?.querySelector('textarea') ?? null
}

/** Backspace/Delete 在变量占位符上时整段删除 */
async function handleTextareaKeydown(event: KeyboardEvent) {
  if (props.readonly) {
    return
  }
  if (event.key !== 'Backspace' && event.key !== 'Delete') {
    return
  }

  const textarea = resolveTextareaElement()
  if (!textarea) {
    return
  }

  const deleteRange = resolveVariableTokenDeleteRange(
    markdownContent.value,
    textarea.selectionStart,
    textarea.selectionEnd,
    event.key,
    props.variables,
  )
  if (!deleteRange) {
    return
  }

  event.preventDefault()
  markdownContent.value =
    markdownContent.value.slice(0, deleteRange.start) + markdownContent.value.slice(deleteRange.end)

  await nextTick()
  textarea.focus()
  textarea.setSelectionRange(deleteRange.start, deleteRange.start)
}

/** 点击变量标签，在光标处插入 $中文变量名 */
async function handleInsertVariable(variable: ReportTemplateVariable) {
  const token = formatReportTemplateVariableToken(variable)
  const textarea = resolveTextareaElement()
  const current = markdownContent.value

  if (!textarea) {
    markdownContent.value = current + token
    return
  }

  const start = textarea.selectionStart ?? current.length
  const end = textarea.selectionEnd ?? current.length
  const { nextText, cursorPosition } = insertTextAtSelection(current, token, start, end)
  markdownContent.value = nextText

  await nextTick()
  textarea.focus()
  textarea.setSelectionRange(cursorPosition, cursorPosition)
}

/** 导出当前 Markdown 正文为 .md 文件下载 */
function handleExportMarkdown() {
  if (!markdownContent.value.trim()) {
    message.warning('模板内容为空，无法导出')
    return
  }

  downloadMarkdownFile(
    markdownContent.value,
    sanitizeReportTemplateMarkdownFileName(props.templateName),
  )
}
</script>

<style scoped>
.markdown-editor {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.markdown-editor__hint {
  flex-shrink: 0;
}

.markdown-editor__hint :deep(.ant-alert-message) {
  width: 100%;
}

.markdown-editor__hint-list {
  margin: 0;
  padding-left: 18px;
  font-size: 13px;
  line-height: 1.7;
  color: rgba(0, 0, 0, 0.65);
}

.markdown-editor__variables {
  flex-shrink: 0;
}

.markdown-editor__variables-title {
  font-size: 14px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.88);
  margin-bottom: 4px;
}

.markdown-editor__variables-desc {
  margin: 0 0 12px;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.45);
  line-height: 1.6;
}

.markdown-editor__variable-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.markdown-editor__variable-tag {
  margin: 0;
  cursor: pointer;
  user-select: none;
}

.markdown-editor__variable-tag:hover {
  border-color: #1677ff;
  color: #1677ff;
}

.markdown-editor__variable-tag--readonly {
  cursor: default;
  pointer-events: none;
}

.markdown-editor__variable-tag--readonly:hover {
  border-color: inherit;
  color: inherit;
}

.markdown-editor__workspace {
  flex: 1;
  min-height: 0;
  display: flex;
}

.markdown-editor__textarea {
  width: 100%;
  height: 100%;
  font-family: Consolas, 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
}

.markdown-editor__textarea :deep(textarea) {
  height: 100% !important;
  min-height: 280px;
  resize: none;
}

.markdown-editor__footer {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-start;
}
</style>
