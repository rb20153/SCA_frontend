<template>
  <span class="action-cell">
    <template v-if="queueStatus === 'pending'">
      <a v-if="canWrite('/system/alerts')" href="#" class="list-table-link" @click.prevent="emit('handle', alert)">处理</a>
      <a href="#" class="list-table-link" @click.prevent="emit('detail', alert)">详情</a>
    </template>
    <template v-else>
      <a href="#" class="list-table-link" @click.prevent="emit('detail', alert)">详情</a>
      <a href="#" class="list-table-link" @click.prevent="emit('timeline', alert)">处理时间线</a>
    </template>
  </span>
</template>

<script setup lang="ts">
import type { AlertListItem, AlertQueueStatus } from '@/types/system'
import { usePagePermission } from '@/composables/usePagePermission'
const { canWrite } = usePagePermission()

defineProps<{
  alert: AlertListItem
  queueStatus: AlertQueueStatus
}>()

const emit = defineEmits<{
  detail: [alert: AlertListItem]
  handle: [alert: AlertListItem]
  timeline: [alert: AlertListItem]
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
