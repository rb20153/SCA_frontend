<template>
  <span class="action-cell">
    <a
      v-if="queueStatus === 'pending'"
      href="#"
      class="list-table-link"
      @click.prevent
    >
      处理
    </a>
    <a href="#" class="list-table-link" @click.prevent="emit('detail', alert)">详情</a>
  </span>
</template>

<script setup lang="ts">
import type { AlertListItem, AlertQueueStatus } from '@/types/system'

defineProps<{
  alert: AlertListItem
  queueStatus: AlertQueueStatus
}>()

const emit = defineEmits<{
  detail: [alert: AlertListItem]
}>()
</script>

<style scoped>
.action-cell {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px 12px;
}
</style>
