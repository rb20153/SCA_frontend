<template>
  <ListQueryBar @search="emit('search')" @reset="emit('reset')">
    <a-form-item label="角色名称">
      <a-input
        v-model:value="filters.roleName"
        placeholder="输入角色名称"
        allow-clear
        class="list-query-input"
        @press-enter="emit('search')"
      />
    </a-form-item>

    <a-form-item label="状态">
      <a-select
        v-model:value="filters.status"
        :options="ROLE_STATUS_FILTER_OPTIONS"
        class="list-query-select"
      />
    </a-form-item>
  </ListQueryBar>
</template>

<script setup lang="ts">
import ListQueryBar from '@/components/common/ListQueryBar.vue'
import type { RoleListFilters } from '@/types/system'
import { ROLE_STATUS_FILTER_OPTIONS } from '@/utils/roleQuery'

const filters = defineModel<RoleListFilters>({ required: true })

const emit = defineEmits<{
  search: []
  reset: []
}>()
</script>
