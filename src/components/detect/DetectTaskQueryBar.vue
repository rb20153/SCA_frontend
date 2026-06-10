<template>
  <ListQueryBar @search="emit('search')" @reset="emit('reset')">
    <a-form-item label="任务名称">
      <a-input
        v-model:value="filters.taskName"
        placeholder="输入任务名称"
        allow-clear
        class="list-query-input"
        @press-enter="emit('search')"
      />
    </a-form-item>

    <a-form-item label="检测类型">
      <a-select
        v-model:value="filters.taskType"
        :options="TASK_TYPE_FILTER_OPTIONS"
        class="list-query-select"
      />
    </a-form-item>

    <a-form-item label="关联项目">
      <a-input
        v-model:value="filters.projectName"
        placeholder="输入项目名称"
        allow-clear
        class="list-query-input"
        @press-enter="emit('search')"
      />
    </a-form-item>

    <a-form-item label="状态">
      <a-select
        v-model:value="filters.status"
        :options="TASK_STATUS_FILTER_OPTIONS"
        class="list-query-select"
      />
    </a-form-item>
  </ListQueryBar>
</template>

<script setup lang="ts">
import ListQueryBar from '@/components/common/ListQueryBar.vue'
import type { TaskListFilters } from '@/types/detect'
import { TASK_STATUS_FILTER_OPTIONS, TASK_TYPE_FILTER_OPTIONS } from '@/utils/taskQuery'

const filters = defineModel<TaskListFilters>({ required: true })

const emit = defineEmits<{
  search: []
  reset: []
}>()
</script>
