<template>
  <EllipsisText v-if="useEllipsis" :text="displayText" />
  <span v-else class="list-table-plain-cell">{{ displayText }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ColumnType } from 'ant-design-vue/es/table'
import EllipsisText from '@/components/common/EllipsisText.vue'
import { shouldColumnEllipsis } from '@/utils/listTable'

const props = defineProps<{
  column: ColumnType
  /** a-table bodyCell 提供的单元格文本 */
  text?: unknown
}>()

const useEllipsis = computed(() => shouldColumnEllipsis(props.column))

const displayText = computed(() => {
  if (props.text === null || props.text === undefined || props.text === '') {
    return '—'
  }
  return String(props.text)
})
</script>

<style scoped>
.list-table-plain-cell {
  display: inline-block;
  max-width: 100%;
}
</style>
