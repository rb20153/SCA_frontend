<template>
  <ListQueryBar @search="emit('search')" @reset="emit('reset')">
    <a-form-item label="来源">
      <a-select
        v-model:value="filters.sourceMode"
        :options="AI_PARSE_SOURCE_FILTER_OPTIONS"
        class="list-query-select"
      />
    </a-form-item>

    <a-form-item label="状态">
      <a-select
        v-model:value="filters.status"
        :options="AI_PARSE_STATUS_FILTER_OPTIONS"
        class="list-query-select"
      />
    </a-form-item>
  </ListQueryBar>
</template>

<script setup lang="ts">
import ListQueryBar from '@/components/common/ListQueryBar.vue'
import type { AiParseTaskListFilters } from '@/types/detect'
import {
  AI_PARSE_SOURCE_FILTER_OPTIONS,
  AI_PARSE_STATUS_FILTER_OPTIONS,
} from '@/utils/aiParseQuery'

const filters = defineModel<AiParseTaskListFilters>({ required: true })

const emit = defineEmits<{
  search: []
  reset: []
}>()
</script>
