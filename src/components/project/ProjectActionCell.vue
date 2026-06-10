<template>
  <span class="action-cell">
    <a href="#" class="list-table-link" @click.prevent="emit('edit', project)">编辑</a>
    <a href="#" class="list-table-link list-table-link--danger" @click.prevent="emit('delete', project)">
      删除
    </a>
  </span>
</template>

<script setup lang="ts">
import type { Project } from '@/types/project'

defineProps<{
  project: Project
}>()

const emit = defineEmits<{
  edit: [project: Project]
  delete: [project: Project]
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
</style>
