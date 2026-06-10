<template>
  <div class="detail-text" :class="{ 'detail-text--pre': preserveBreaks }">
    <slot>{{ displayText }}</slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 详情/抽屉中的长文本 */
    text?: string | null
    /** 是否保留换行符（错误日志等场景） */
    preserveBreaks?: boolean
  }>(),
  {
    preserveBreaks: false,
  },
)

const displayText = computed(() => props.text ?? '')
</script>

<style scoped>
.detail-text {
  white-space: normal;
  word-break: break-word;
  overflow-wrap: anywhere;
  line-height: 1.6;
  color: rgba(0, 0, 0, 0.88);
}

.detail-text--pre {
  white-space: pre-wrap;
}
</style>
