<template>
  <span class="action-cell">
    <a
      href="#"
      class="list-table-link"
      @click.prevent="emit('transfer-owner', member)"
    >
      设为负责人
    </a>
    <a
      href="#"
      class="list-table-link list-table-link--danger"
      @click.prevent="emit('remove', member)"
    >
      移除
    </a>
  </span>
</template>

<script setup lang="ts">
import type { ProjectMember } from '@/types/project'

defineProps<{
  member: ProjectMember
}>()

const emit = defineEmits<{
  'transfer-owner': [member: ProjectMember]
  remove: [member: ProjectMember]
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
