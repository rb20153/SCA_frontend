<template>
  <span class="action-cell">
    <a v-if="canWrite('/system/roles')" class="list-table-link" @click.prevent="emit('edit', role)">修改</a>
    <span v-if="role.isBuiltin" class="builtin-label">内置</span>
    <a
      v-else-if="canWrite('/system/roles')"
      class="list-table-link list-table-link--danger"
      @click.prevent="emit('delete', role)"
    >
      删除
    </a>
  </span>
</template>

<script setup lang="ts">
import type { Role } from '@/types/system'
import { usePagePermission } from '@/composables/usePagePermission'
const { canWrite } = usePagePermission()

defineProps<{
  role: Role
}>()

const emit = defineEmits<{
  edit: [role: Role]
  delete: [role: Role]
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

.builtin-label {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.25);
  cursor: not-allowed;
  user-select: none;
}
</style>
