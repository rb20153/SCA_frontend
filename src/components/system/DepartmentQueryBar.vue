<template>
  <ListQueryBar @search="emit('search')" @reset="emit('reset')">
    <a-form-item label="部门名称">
      <a-input
        v-model:value="filters.departmentName"
        placeholder="输入部门名称"
        allow-clear
        class="list-query-input"
        @press-enter="emit('search')"
      />
    </a-form-item>

    <a-form-item label="状态">
      <a-select
        v-model:value="filters.status"
        :options="DEPARTMENT_STATUS_FILTER_OPTIONS"
        class="list-query-select"
      />
    </a-form-item>
  </ListQueryBar>
</template>

<script setup lang="ts">
import ListQueryBar from '@/components/common/ListQueryBar.vue'
import type { DepartmentListFilters } from '@/types/system'
import { DEPARTMENT_STATUS_FILTER_OPTIONS } from '@/utils/departmentQuery'

const filters = defineModel<DepartmentListFilters>({ required: true })

const emit = defineEmits<{
  search: []
  reset: []
}>()
</script>
