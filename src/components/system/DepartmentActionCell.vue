<template>
  <span class="action-cell">
    <a class="list-table-link" @click.prevent="emit('edit', department)">修改</a>
    <a class="list-table-link list-table-link--danger" @click.prevent="emit('delete', department)">
      删除
    </a>
  </span>
</template>

<script setup lang="ts">
import type { Department } from '@/types/system'

defineProps<{
  department: Department
}>()

const emit = defineEmits<{
  edit: [department: Department]
  delete: [department: Department]
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
