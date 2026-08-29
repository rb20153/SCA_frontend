<template>
  <span class="action-cell">
    <a href="#" class="list-table-link" @click.prevent="emit('diff', version)">差异</a>

    <template v-if="version.status === 'published'">
      <a href="#" class="list-table-link" @click.prevent="emit('export', version)">导出</a>
    </template>

    <template v-else-if="version.status === 'pending'">
      <a v-if="canApprovePolicy()" href="#" class="list-table-link" @click.prevent="emit('approve', version)">审批</a>
    </template>

    <template v-else-if="version.status === 'history'">
      <a v-if="canWrite('/policies')" href="#" class="list-table-link" @click.prevent="emit('rollback', version)">回滚</a>
    </template>
  </span>
</template>

<script setup lang="ts">
import type { PolicyVersionListItem } from '@/types/policy'
import { usePagePermission } from '@/composables/usePagePermission'
const { canApprovePolicy, canWrite } = usePagePermission()

defineProps<{
  version: PolicyVersionListItem
}>()

const emit = defineEmits<{
  diff: [version: PolicyVersionListItem]
  approve: [version: PolicyVersionListItem]
  export: [version: PolicyVersionListItem]
  rollback: [version: PolicyVersionListItem]
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
