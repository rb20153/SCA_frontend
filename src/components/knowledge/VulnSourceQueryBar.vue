<template>
  <ListQueryBar @search="emit('search')" @reset="emit('reset')">
    <a-form-item label="来源">
      <a-select
        v-model:value="filters.sourceCode"
        :options="VULN_SOURCE_FILTER_OPTIONS"
        class="list-query-select"
      />
    </a-form-item>

    <a-form-item label="同步状态">
      <a-select
        v-model:value="filters.syncStatus"
        :options="VULN_SYNC_STATUS_FILTER_OPTIONS"
        class="list-query-select"
      />
    </a-form-item>

    <a-form-item label="关键词">
      <a-input
        v-model:value="filters.keyword"
        placeholder="来源名称/描述/标签"
        allow-clear
        class="list-query-input list-query-input-wide"
        @press-enter="emit('search')"
      />
    </a-form-item>
  </ListQueryBar>
</template>

<script setup lang="ts">
import ListQueryBar from '@/components/common/ListQueryBar.vue'
import type { VulnSourceListFilters } from '@/types/knowledge'
import {
  VULN_SOURCE_FILTER_OPTIONS,
  VULN_SYNC_STATUS_FILTER_OPTIONS,
} from '@/utils/vulnKnowledgeQuery'

const filters = defineModel<VulnSourceListFilters>({ required: true })

const emit = defineEmits<{
  search: []
  reset: []
}>()
</script>
