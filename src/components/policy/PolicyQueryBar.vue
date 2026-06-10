<template>
  <ListQueryBar @search="emit('search')" @reset="emit('reset')">
    <a-form-item label="策略名称">
      <a-input
        v-model:value="filters.policyName"
        placeholder="搜索策略名称"
        allow-clear
        class="list-query-input"
        @press-enter="emit('search')"
      />
    </a-form-item>

    <a-form-item label="适用场景">
      <a-input
        v-model:value="filters.scenario"
        placeholder="搜索适用场景"
        allow-clear
        class="list-query-input"
        @press-enter="emit('search')"
      />
    </a-form-item>
  </ListQueryBar>
</template>

<script setup lang="ts">
import ListQueryBar from '@/components/common/ListQueryBar.vue'
import type { PolicyListFilters } from '@/types/policy'

const filters = defineModel<PolicyListFilters>({ required: true })

const emit = defineEmits<{
  search: []
  reset: []
}>()
</script>
