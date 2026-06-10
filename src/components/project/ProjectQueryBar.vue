<template>
  <ListQueryBar @search="emit('search')" @reset="emit('reset')">
    <a-form-item label="项目名称">
      <a-input
        v-model:value="filters.projectName"
        placeholder="输入项目名称"
        allow-clear
        class="list-query-input"
        @press-enter="emit('search')"
      />
    </a-form-item>

    <a-form-item label="负责人">
      <a-input
        v-model:value="filters.owner"
        placeholder="输入负责人"
        allow-clear
        class="list-query-input"
        @press-enter="emit('search')"
      />
    </a-form-item>

    <a-form-item label="状态">
      <a-select
        v-model:value="filters.status"
        :options="PROJECT_STATUS_FILTER_OPTIONS"
        class="list-query-select"
      />
    </a-form-item>

    <a-form-item label="创建时间">
      <a-range-picker
        v-model:value="filters.createdAtRange"
        show-time
        format="YYYY-MM-DD HH:mm"
        :placeholder="['开始时间', '结束时间']"
        class="list-query-datetime-range"
      />
    </a-form-item>
  </ListQueryBar>
</template>

<script setup lang="ts">
import ListQueryBar from '@/components/common/ListQueryBar.vue'
import type { ProjectListFilters } from '@/types/project'
import { PROJECT_STATUS_FILTER_OPTIONS } from '@/utils/projectQuery'

const filters = defineModel<ProjectListFilters>({ required: true })

const emit = defineEmits<{
  search: []
  reset: []
}>()
</script>
