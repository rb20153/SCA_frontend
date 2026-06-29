<template>
  <span class="action-cell">
    <a href="#" class="list-table-link" @click.prevent="emit('edit', policy)">编辑</a>
    <a href="#" class="list-table-link" @click.prevent="goGovernance">版本/审批</a>
    <a href="#" class="list-table-link" @click.prevent="goTrace">命中追溯</a>
    <a href="#" class="list-table-link list-table-link--danger" @click.prevent="emit('delete', policy)">
      删除
    </a>
  </span>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { Policy } from '@/types/policy'
import { navigateToPolicySubPage } from '@/utils/policyDisplay'

const props = defineProps<{
  policy: Policy
}>()

const emit = defineEmits<{
  edit: [policy: Policy]
  delete: [policy: Policy]
}>()

const router = useRouter()

/** 跳转版本与审批页 */
function goGovernance() {
  navigateToPolicySubPage(router, props.policy, 'governance')
}

/** 跳转规则命中追溯页 */
function goTrace() {
  navigateToPolicySubPage(router, props.policy, 'trace')
}
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
