<template>
  <ListQueryBar @search="emit('search')" @reset="emit('reset')">
    <a-form-item label="关键词">
      <a-input
        v-model:value="filters.keyword"
        placeholder="输入关键词"
        allow-clear
        class="list-query-input"
        @press-enter="emit('search')"
      />
    </a-form-item>

    <a-form-item label="来源">
      <a-input
        v-model:value="filters.sourceName"
        placeholder="输入来源名称"
        allow-clear
        class="list-query-input"
        @change="onSourceNameChange"
        @press-enter="emit('search')"
      />
    </a-form-item>

    <a-form-item label="等级">
      <a-select
        v-model:value="filters.level"
        :options="VULN_ITEM_LEVEL_FILTER_OPTIONS"
        class="list-query-select"
      />
    </a-form-item>

    <a-form-item label="状态">
      <a-select
        v-model:value="filters.status"
        :options="VULN_ITEM_STATUS_FILTER_OPTIONS"
        class="list-query-select"
      />
    </a-form-item>

    <a-form-item label="CVE/CNVD">
      <a-input
        v-model:value="filters.identifier"
        placeholder="输入编号"
        allow-clear
        class="list-query-input"
        @press-enter="emit('search')"
      />
    </a-form-item>
  </ListQueryBar>
</template>

<script setup lang="ts">
import ListQueryBar from '@/components/common/ListQueryBar.vue'
import type { VulnItemListFilters } from '@/types/knowledge'
import {
  VULN_ITEM_LEVEL_FILTER_OPTIONS,
  VULN_ITEM_STATUS_FILTER_OPTIONS,
} from '@/utils/vulnItemQuery'

const filters = defineModel<VulnItemListFilters>({ required: true })

const emit = defineEmits<{
  search: []
  reset: []
}>()

/** 用户手动修改来源名称时清除路由携带的 sourceId，避免名称与 ID 冲突 */
function onSourceNameChange() {
  filters.value.sourceId = ''
}
</script>
