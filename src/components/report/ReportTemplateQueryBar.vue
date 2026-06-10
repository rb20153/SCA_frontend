<template>
  <ListQueryBar @search="emit('search')" @reset="emit('reset')">
    <a-form-item label="模板名称">
      <a-input
        v-model:value="filters.templateName"
        placeholder="搜索模板名称"
        allow-clear
        class="list-query-input"
        @press-enter="emit('search')"
      />
    </a-form-item>

    <a-form-item label="输出格式">
      <a-select
        v-model:value="filters.outputFormat"
        class="list-query-select"
        :options="REPORT_TEMPLATE_OUTPUT_FORMAT_FILTER_OPTIONS"
      />
    </a-form-item>

    <a-form-item label="可见范围">
      <a-select
        v-model:value="filters.visibility"
        class="list-query-select"
        :options="REPORT_TEMPLATE_VISIBILITY_FILTER_OPTIONS"
      />
    </a-form-item>

    <a-form-item label="状态">
      <a-select
        v-model:value="filters.status"
        class="list-query-select"
        :options="REPORT_TEMPLATE_STATUS_FILTER_OPTIONS"
      />
    </a-form-item>
  </ListQueryBar>
</template>

<script setup lang="ts">
import ListQueryBar from '@/components/common/ListQueryBar.vue'
import type { ReportTemplateListFilters } from '@/types/reportTemplate'
import {
  REPORT_TEMPLATE_OUTPUT_FORMAT_FILTER_OPTIONS,
  REPORT_TEMPLATE_STATUS_FILTER_OPTIONS,
  REPORT_TEMPLATE_VISIBILITY_FILTER_OPTIONS,
} from '@/utils/reportTemplateQuery'

const filters = defineModel<ReportTemplateListFilters>({ required: true })

const emit = defineEmits<{
  search: []
  reset: []
}>()
</script>
