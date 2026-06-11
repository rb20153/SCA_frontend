<template>
  <a-spin :spinning="loading">
    <a-empty v-if="!loading && weeks.length === 0" description="暂无更新记录" />
    <ul v-else class="coverage-week-list">
      <li v-for="item in weeks" :key="item.weekLabel" class="coverage-week-item">
        <span class="coverage-week-label">{{ item.weekLabel }}</span>
        <span class="coverage-week-summary">{{ item.summary }}</span>
      </li>
    </ul>
  </a-spin>
</template>

<script setup lang="ts">
import type { CoverageUpdateTrendWeek } from '@/types/knowledge'

defineProps<{
  weeks: CoverageUpdateTrendWeek[]
  loading?: boolean
}>()
</script>

<style scoped>
.coverage-week-list {
  margin: 0;
  padding: 12px 16px 16px;
  list-style: none;
}

.coverage-week-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.coverage-week-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.coverage-week-label {
  flex-shrink: 0;
  min-width: 40px;
  font-family: Consolas, Monaco, monospace;
  font-size: 13px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.65);
}

.coverage-week-summary {
  flex: 1;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.88);
  line-height: 1.5;
}
</style>
