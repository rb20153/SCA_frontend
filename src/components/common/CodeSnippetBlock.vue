<template>
  <pre v-if="content != null && content !== ''" class="code-snippet-block">{{ content }}</pre>
  <pre v-else-if="lines && lines.length > 0" class="code-snippet-block code-diff-pane"><code><span
      v-for="(line, index) in buildDisplayLines(lines)"
      :key="`${line.kind}-${line.lineNumber}-${index}`"
      :class="diffLineClass(line.kind)"
    ><template v-if="line.kind !== 'spacer'"><span v-if="line.kind === 'context'" class="diff-ln">{{ line.lineNumber }}</span><template v-else>{{ diffLinePrefix(line.kind) }}</template>{{ line.text }}
</template></span></code></pre>
</template>

<script setup lang="ts">
import type { CodeDiffLine } from '@/types/common'

defineProps<{
  /** 等宽展示的纯文本代码/日志片段 */
  content?: string
  /** diff 模式行列表（与 content 二选一） */
  lines?: CodeDiffLine[]
}>()

/** 将 diff 行列表转为展示列表：删除行与新增行之间自动插入空行 */
function buildDisplayLines(lines: CodeDiffLine[]): CodeDiffLine[] {
  const result: CodeDiffLine[] = []
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    result.push(line)
    if (line.kind === 'delete' && lines[index + 1]?.kind === 'add') {
      result.push({ kind: 'spacer', lineNumber: 0, text: '' })
    }
  }
  return result
}

/** diff 行样式类名 */
function diffLineClass(kind: CodeDiffLine['kind']): string {
  if (kind === 'delete') {
    return 'diff-del'
  }
  if (kind === 'add') {
    return 'diff-add'
  }
  if (kind === 'spacer') {
    return 'diff-spacer'
  }
  return 'diff-context'
}

/** diff 行前缀：删除 -、新增 +、上下文空格；空行无前缀 */
function diffLinePrefix(kind: CodeDiffLine['kind']): string {
  if (kind === 'delete') {
    return '-'
  }
  if (kind === 'add') {
    return '+'
  }
  if (kind === 'spacer') {
    return ''
  }
  return ' '
}
</script>

<style scoped>
.code-snippet-block {
  margin: 0;
  padding: 12px 14px;
  background: #1e1e1e;
  border: 1px solid #2d2d2d;
  border-radius: 6px;
  font-family: Consolas, Monaco, 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.65;
  white-space: pre-wrap;
  word-break: break-word;
  color: #d4d4d4;
}

.code-diff-pane {
  line-height: 2.1;
  padding: 16px 14px;
  min-height: 200px;
}

.diff-ln {
  color: #858585;
  margin-right: 8px;
  user-select: none;
}

.diff-context {
  display: block;
  padding: 4px 0;
}

.diff-del {
  display: block;
  padding: 4px 0;
  background: rgba(255, 77, 79, 0.15);
  color: #ffa39e;
}

.diff-add {
  display: block;
  padding: 4px 0;
  background: rgba(82, 196, 26, 0.15);
  color: #b7eb8f;
}

.diff-spacer {
  display: block;
  height: 2.1em;
}
</style>
