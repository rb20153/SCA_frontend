<template>
  <a-typography-text
    class="ellipsis-text"
    :ellipsis="{ tooltip: displayText }"
    :content="displayText"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  /** 展示文本；空值显示为 — */
  text?: string | number | null
}>()

const displayText = computed(() => {
  if (props.text === null || props.text === undefined || props.text === '') {
    return '—'
  }
  return String(props.text)
})
</script>

<style scoped>
.ellipsis-text {
  display: block;
  max-width: 100%;
  margin-bottom: 0;
}
</style>
