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

    <a-form-item label="分类">
      <a-select
        v-model:value="filters.category"
        class="list-query-select"
        :options="KB_PROJECT_CATEGORY_FILTER_OPTIONS"
      />
    </a-form-item>

    <a-form-item label="采集方式">
      <a-select
        v-model:value="filters.collectMode"
        class="list-query-select"
        :options="KB_COLLECT_MODE_FILTER_OPTIONS"
      />
    </a-form-item>

    <a-form-item label="最近更新">
      <a-date-picker
        v-model:value="filters.updatedDate"
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
import type { KbProjectListFilters } from '@/types/knowledge'
import {
  KB_COLLECT_MODE_FILTER_OPTIONS,
  KB_PROJECT_CATEGORY_FILTER_OPTIONS,
} from '@/utils/knowledgeQuery'

const filters = defineModel<KbProjectListFilters>({ required: true })

const emit = defineEmits<{
  search: []
  reset: []
}>()
</script>
