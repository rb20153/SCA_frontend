<template>
  <ListQueryBar @search="emit('search')" @reset="emit('reset')">
    <a-form-item label="报告名称">
      <a-input
        v-model:value="filters.reportName"
        placeholder="搜索报告名称"
        allow-clear
        class="list-query-input"
        @press-enter="emit('search')"
      />
    </a-form-item>

    <a-form-item label="项目名称">
      <a-input
        v-model:value="filters.projectName"
        placeholder="搜索项目名称"
        allow-clear
        class="list-query-input"
        @press-enter="emit('search')"
      />
    </a-form-item>

    <a-form-item label="生成时间">
      <a-date-picker
        v-model:value="filters.generatedDate"
        format="YYYY-MM-DD"
        placeholder="选择日期"
        allow-clear
        class="list-query-date"
      />
    </a-form-item>
  </ListQueryBar>
</template>

<script setup lang="ts">
import ListQueryBar from '@/components/common/ListQueryBar.vue'
import type { ReportListFilters } from '@/types/report'

const filters = defineModel<ReportListFilters>({ required: true })

const emit = defineEmits<{
  search: []
  reset: []
}>()
</script>
