<template>
  <ListQueryBar @search="emit('search')" @reset="emit('reset')">
    <a-form-item label="来源项目">
      <a-input
        v-model:value="filters.kbProjectName"
        placeholder="搜索知识库项目"
        allow-clear
        class="list-query-input"
        @press-enter="emit('search')"
      />
    </a-form-item>

    <a-form-item label="风险等级">
      <a-select
        v-model:value="filters.riskLevel"
        :options="AUTONOMY_SOURCE_HIT_LEVEL_FILTER_OPTIONS"
        class="list-query-select"
      />
    </a-form-item>
  </ListQueryBar>
</template>

<script setup lang="ts">
import ListQueryBar from '@/components/common/ListQueryBar.vue'
import type { AutonomySourceHitListFilters } from '@/types/detect'
import { AUTONOMY_SOURCE_HIT_LEVEL_FILTER_OPTIONS } from '@/utils/autonomyDetectResultDisplay'

const filters = defineModel<AutonomySourceHitListFilters>({ required: true })

const emit = defineEmits<{
  search: []
  reset: []
}>()
</script>
