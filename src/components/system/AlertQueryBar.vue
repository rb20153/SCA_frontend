<template>
  <ListQueryBar @search="emit('search')" @reset="emit('reset')">
    <a-form-item label="级别">
      <a-select
        v-model:value="filters.level"
        class="list-query-select"
        :options="ALERT_LEVEL_FILTER_OPTIONS"
      />
    </a-form-item>

    <a-form-item label="时间">
      <a-date-picker
        v-model:value="filters.occurredAt"
        show-time
        format="YYYY-MM-DD HH:mm"
        placeholder="选择日期时间"
        class="list-query-datetime"
      />
    </a-form-item>
  </ListQueryBar>
</template>

<script setup lang="ts">
import ListQueryBar from '@/components/common/ListQueryBar.vue'
import type { AlertListFilters } from '@/types/system'
import { ALERT_LEVEL_FILTER_OPTIONS } from '@/utils/alertQuery'

const filters = defineModel<AlertListFilters>({ required: true })

const emit = defineEmits<{
  search: []
  reset: []
}>()
</script>
