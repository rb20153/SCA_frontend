<template>
  <ListQueryBar @search="emit('search')" @reset="emit('reset')">
    <a-form-item label="季度">
      <AsyncOptionsSelect
        ref="quarterSelectRef"
        v-model="filters.quarter"
        placeholder="全部季度"
        :allow-clear="false"
        :show-search="false"
        select-class="list-query-select"
        :load-options="loadQuarterOptions"
      />
    </a-form-item>

    <a-form-item label="状态">
      <a-select
        v-model:value="filters.status"
        :options="KB_QUARTER_UPDATE_STATUS_FILTER_OPTIONS"
        class="list-query-select"
      />
    </a-form-item>

    <a-form-item label="采集方式">
      <a-select
        v-model:value="filters.collectMode"
        :options="KB_QUARTER_UPDATE_COLLECT_MODE_FILTER_OPTIONS"
        class="list-query-select"
      />
    </a-form-item>

    <a-form-item label="摘要关键词">
      <a-input
        v-model:value="filters.summaryKeyword"
        placeholder="匹配摘要部分文字"
        allow-clear
        class="list-query-input-wide"
        @press-enter="emit('search')"
      />
    </a-form-item>
  </ListQueryBar>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AsyncOptionsSelect from '@/components/common/AsyncOptionsSelect.vue'
import ListQueryBar from '@/components/common/ListQueryBar.vue'
import type { KbQuarterUpdateListFilters } from '@/types/knowledge'
import {
  KB_QUARTER_UPDATE_COLLECT_MODE_FILTER_OPTIONS,
  KB_QUARTER_UPDATE_STATUS_FILTER_OPTIONS,
} from '@/utils/kbQuarterUpdateQuery'
import { loadKbQuarterUpdateQuarterSelectOptions } from '@/utils/remoteSelectLoaders'

const filters = defineModel<KbQuarterUpdateListFilters>({ required: true })

const emit = defineEmits<{
  search: []
  reset: []
}>()

const quarterSelectRef = ref<InstanceType<typeof AsyncOptionsSelect> | null>(null)

/** 拉取已有季度选项（含「全部季度」） */
function loadQuarterOptions() {
  return loadKbQuarterUpdateQuarterSelectOptions()
}

/** 预加载季度下拉，保证默认「全部季度」能展示 label */
async function prefetchQuarterOptions() {
  quarterSelectRef.value?.seedOption({ value: '', label: '全部季度' })
  await quarterSelectRef.value?.prefetchOptions()
}

onMounted(() => {
  void prefetchQuarterOptions()
})
</script>
