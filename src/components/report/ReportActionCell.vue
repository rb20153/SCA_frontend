<template>
  <span class="action-cell">
    <template v-if="report.status === 'completed'">
      <a href="#" class="list-table-link" @click.prevent="emit('view', report)">查看</a>
      <a
        href="#"
        class="list-table-link"
        :class="{ 'list-table-link--disabled': downloadChecking }"
        @click.prevent="emit('download', report)"
      >
        下载
      </a>
    </template>

    <a
      v-if="report.status === 'failed'"
      href="#"
      class="list-table-link"
      @click.prevent="emit('failure-reason', report)"
    >
      失败原因
    </a>

    <a
      v-if="canWrite('/reports')"
      href="#"
      class="list-table-link list-table-link--danger"
      @click.prevent="emit('delete', report)"
    >
      删除
    </a>
  </span>
</template>

<script setup lang="ts">
import type { Report } from '@/types/report'
import { usePagePermission } from '@/composables/usePagePermission'
const { canWrite } = usePagePermission()

defineProps<{
  report: Report
  downloadChecking?: boolean
}>()

const emit = defineEmits<{
  delete: [report: Report]
  'failure-reason': [report: Report]
  download: [report: Report]
  view: [report: Report]
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

.list-table-link--disabled {
  pointer-events: none;
  opacity: 0.5;
}
</style>
