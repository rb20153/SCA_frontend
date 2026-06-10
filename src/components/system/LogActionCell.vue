<template>
  <a href="#" class="list-table-link" @click.prevent="emit('detail', log)">全链路详情</a>
</template>

<script setup lang="ts">
import type { LogListItem } from '@/types/system'

defineProps<{
  log: LogListItem
}>()

const emit = defineEmits<{
  detail: [log: LogListItem]
}>()
</script>
