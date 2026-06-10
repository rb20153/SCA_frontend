<template>
  <span class="action-cell">
    <router-link :to="editorPath" class="list-table-link">编辑</router-link>
    <router-link :to="governancePath" class="list-table-link">版本/审批</router-link>
    <router-link :to="governancePath" class="list-table-link">命中追溯</router-link>
    <a href="#" class="list-table-link list-table-link--danger" @click.prevent="emit('delete', policy)">
      删除
    </a>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Policy } from '@/types/policy'

const props = defineProps<{
  policy: Policy
}>()

const emit = defineEmits<{
  delete: [policy: Policy]
}>()

/** 策略编辑器路由 */
const editorPath = computed(() => `/policies/${props.policy.policyId}/edit`)

/** 版本与审批 / 命中追溯路由 */
const governancePath = computed(() => `/policies/${props.policy.policyId}/governance`)
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
