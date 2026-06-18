<template>
  <a-card :bordered="false" class="chain-timeline-card">
    <a-timeline>
      <a-timeline-item v-for="(item, index) in items" :key="index">
        <span class="chain-timeline-time">{{ item.time }}</span>
        <DetailText :text="item.message" />
      </a-timeline-item>
    </a-timeline>
  </a-card>
</template>

<script setup lang="ts">
import DetailText from '@/components/common/DetailText.vue'
import type { LogTimelineItem } from '@/types/system'

defineProps<{
  /** 链路时间线条目（时刻 + 描述） */
  items: LogTimelineItem[]
}>()
</script>

<style scoped>
.chain-timeline-card {
  background: #fafafa;
}

.chain-timeline-time {
  display: inline-block;
  min-width: 72px;
  margin-right: 8px;
  color: rgba(0, 0, 0, 0.45);
  font-family: Consolas, Monaco, monospace;
}
</style>
