<template>
  <div class="stat-card-row" :class="rowClass">
    <StatCard
      v-for="item in items"
      :key="item.key"
      :label="item.label"
      :value="item.value"
      :growth="item.growth"
      :growth-suffix="item.growthSuffix"
      :warn-value="item.warnValue"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { StatCardItem } from '@/types/common'
import StatCard from '@/components/common/StatCard.vue'

const props = withDefaults(
  defineProps<{
    /** 统计卡片数据 */
    items: StatCardItem[]
    /**
     * 大屏下一行展示的列数
     * - 4：首页等四宫格
     * - 5：版本管理等五宫格
     */
    columns?: 4 | 5
  }>(),
  {
    columns: 4,
  },
)

/** 按列数切换栅格样式类 */
const rowClass = computed(() =>
  props.columns === 5 ? 'stat-card-row--cols-5' : 'stat-card-row--cols-4',
)
</script>

<style scoped>
.stat-card-row {
  display: grid;
  gap: 16px;
  margin-bottom: 16px;
}

.stat-card-row--cols-4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.stat-card-row--cols-5 {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

@media (max-width: 1200px) {
  .stat-card-row--cols-4 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .stat-card-row--cols-5 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .stat-card-row--cols-4,
  .stat-card-row--cols-5 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 576px) {
  .stat-card-row--cols-4,
  .stat-card-row--cols-5 {
    grid-template-columns: 1fr;
  }
}
</style>
