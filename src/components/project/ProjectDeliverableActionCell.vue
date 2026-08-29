<template>
  <span class="action-cell">
    <a
      v-if="deliverable.sourceMode === 'repo-pull'"
      href="#"
      class="list-table-link"
      @click.prevent="emit('view-source', deliverable)"
    >
      查看来源
    </a>
    <a
      v-else
      href="#"
      class="list-table-link"
      :class="{ 'list-table-link--disabled': downloading }"
      @click.prevent="emit('download', deliverable)"
    >
      下载
    </a>
    <a
      v-if="canWrite('/projects')"
      href="#"
      class="list-table-link list-table-link--danger"
      @click.prevent="emit('delete', deliverable)"
    >
      删除
    </a>
  </span>
</template>

<script setup lang="ts">
import type { ProjectDeliverable } from '@/types/project'
import { usePagePermission } from '@/composables/usePagePermission'

const { canWrite } = usePagePermission()

defineProps<{
  deliverable: ProjectDeliverable
  downloading?: boolean
}>()

const emit = defineEmits<{
  'view-source': [deliverable: ProjectDeliverable]
  download: [deliverable: ProjectDeliverable]
  delete: [deliverable: ProjectDeliverable]
}>()
</script>

<style scoped>
.action-cell {
  display: inline-flex;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: center;
  gap: 12px;
  white-space: nowrap;
}

.list-table-link--disabled {
  color: rgba(0, 0, 0, 0.25);
  cursor: not-allowed;
  pointer-events: none;
}
</style>
