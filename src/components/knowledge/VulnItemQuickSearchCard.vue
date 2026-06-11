<template>
  <div v-if="loading || suggestions.length > 0" class="quick-search-bar">
    <span class="quick-search-label">快捷检索</span>
    <a-spin v-if="loading" size="small" />
    <div v-else class="quick-search-tags">
      <a-tooltip v-for="item in suggestions" :key="item.suggestionId" :title="item.label">
        <a-tag class="quick-search-tag" @click="emit('select', item)">
          {{ formatQuickSearchTagLabel(item) }}
        </a-tag>
      </a-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { VulnItemQuickSearchSuggestion } from '@/types/knowledge'
import { formatQuickSearchTagLabel } from '@/utils/vulnItemQuery'

defineProps<{
  suggestions: VulnItemQuickSearchSuggestion[]
  loading?: boolean
}>()

const emit = defineEmits<{
  select: [suggestion: VulnItemQuickSearchSuggestion]
}>()
</script>

<style scoped>
.quick-search-bar {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 8px 12px;
  min-width: 0;
}

.quick-search-label {
  flex-shrink: 0;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.45);
  line-height: 22px;
}

.quick-search-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.quick-search-tag {
  margin: 0;
  cursor: pointer;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.quick-search-tag:hover {
  color: #1677ff;
  border-color: #1677ff;
}
</style>
