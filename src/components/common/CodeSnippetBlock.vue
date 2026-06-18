<template>
  <pre class="code-snippet-block">{{ content }}</pre>
</template>

<script setup lang="ts">
defineProps<{
  /** 等宽展示的代码/日志片段文本 */
  content: string
}>()
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
</style>
