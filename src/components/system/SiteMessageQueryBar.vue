<template>
  <ListQueryBar @search="emit('search')" @reset="emit('reset')">
    <a-form-item label="消息类型">
      <a-select
        v-model:value="filters.type"
        :options="SITE_MESSAGE_TYPE_FILTER_OPTIONS"
        class="list-query-select"
      />
    </a-form-item>

    <a-form-item label="标题">
      <a-input
        v-model:value="filters.title"
        placeholder="输入标题关键词"
        allow-clear
        class="list-query-input-wide"
        @press-enter="emit('search')"
      />
    </a-form-item>

    <a-form-item label="状态">
      <a-select
        v-model:value="filters.readStatus"
        :options="SITE_MESSAGE_READ_FILTER_OPTIONS"
        class="list-query-select"
      />
    </a-form-item>
  </ListQueryBar>
</template>

<script setup lang="ts">
import ListQueryBar from '@/components/common/ListQueryBar.vue'
import type { SiteMessageListFilters } from '@/types/siteMessage'
import {
  SITE_MESSAGE_READ_FILTER_OPTIONS,
  SITE_MESSAGE_TYPE_FILTER_OPTIONS,
} from '@/utils/siteMessageDisplay'

const filters = defineModel<SiteMessageListFilters>({ required: true })

const emit = defineEmits<{
  search: []
  reset: []
}>()
</script>
