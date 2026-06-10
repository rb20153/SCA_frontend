<template>
  <ListQueryBar @search="emit('search')" @reset="emit('reset')">
    <a-form-item label="TraceID">
      <a-input
        v-model:value="filters.traceId"
        placeholder="输入 TraceID"
        allow-clear
        class="list-query-input"
        @press-enter="emit('search')"
      />
    </a-form-item>

    <a-form-item label="时间范围">
      <a-range-picker
        v-model:value="filters.occurredAtRange"
        show-time
        format="YYYY-MM-DD HH:mm"
        :placeholder="['开始时间', '结束时间']"
        class="list-query-datetime-range"
      />
    </a-form-item>

    <a-form-item label="用户">
      <a-input
        v-model:value="filters.username"
        placeholder="输入用户"
        allow-clear
        class="list-query-input"
        @press-enter="emit('search')"
      />
    </a-form-item>

    <a-form-item label="模块">
      <a-input
        v-model:value="filters.module"
        placeholder="输入模块"
        allow-clear
        class="list-query-input"
        @press-enter="emit('search')"
      />
    </a-form-item>

    <a-form-item label="结果">
      <a-select
        v-model:value="filters.result"
        :options="LOG_RESULT_FILTER_OPTIONS"
        class="list-query-select"
      />
    </a-form-item>
  </ListQueryBar>
</template>

<script setup lang="ts">
import ListQueryBar from '@/components/common/ListQueryBar.vue'
import type { LogListFilters } from '@/types/system'
import { LOG_RESULT_FILTER_OPTIONS } from '@/utils/logQuery'

const filters = defineModel<LogListFilters>({ required: true })

const emit = defineEmits<{
  search: []
  reset: []
}>()
</script>
