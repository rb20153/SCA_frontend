<template>
  <ListQueryBar @search="emit('search')" @reset="emit('reset')">
    <a-form-item label="组件名">
      <a-input
        v-model:value="filters.componentName"
        placeholder="搜索组件"
        allow-clear
        class="list-query-input"
        @press-enter="emit('search')"
      />
    </a-form-item>

    <a-form-item label="来源">
      <a-select
        v-model:value="filters.sourceMode"
        :options="RISK_COMPONENT_SOURCE_FILTER_OPTIONS"
        class="list-query-select"
      />
    </a-form-item>

    <a-form-item label="风险等级">
      <a-select
        v-model:value="filters.riskLevel"
        :options="RISK_COMPONENT_LEVEL_FILTER_OPTIONS"
        class="list-query-select"
      />
    </a-form-item>

    <a-form-item class="show-ignored-item">
      <a-checkbox v-model:checked="filters.showIgnored">显示已忽略组件</a-checkbox>
    </a-form-item>
  </ListQueryBar>
</template>

<script setup lang="ts">
import ListQueryBar from '@/components/common/ListQueryBar.vue'
import type { OpenSourceRiskComponentListFilters } from '@/types/detect'
import {
  RISK_COMPONENT_LEVEL_FILTER_OPTIONS,
  RISK_COMPONENT_SOURCE_FILTER_OPTIONS,
} from '@/utils/openSourceRiskComponentQuery'

const filters = defineModel<OpenSourceRiskComponentListFilters>({ required: true })

const emit = defineEmits<{
  search: []
  reset: []
}>()
</script>

<style scoped>
.show-ignored-item {
  margin-bottom: 0;
}

.show-ignored-item :deep(.ant-form-item-control-input) {
  min-height: 32px;
  align-items: center;
}
</style>
