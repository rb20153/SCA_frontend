<template>
  <span class="action-cell">
    <a class="list-table-link" @click.prevent="emit('edit', user)">修改</a>
    <a class="list-table-link" @click.prevent="emit('detail', user)">详情</a>
    <a class="list-table-link list-table-link--danger" @click.prevent="emit('delete', user)">
      删除
    </a>
    <a class="list-table-link" @click.prevent="emit('reset-password', user)">重置密码</a>
  </span>
</template>

<script setup lang="ts">
import type { SystemUser } from '@/types/user'

defineProps<{
  user: SystemUser
}>()

const emit = defineEmits<{
  edit: [user: SystemUser]
  detail: [user: SystemUser]
  delete: [user: SystemUser]
  'reset-password': [user: SystemUser]
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
