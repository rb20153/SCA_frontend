<template>
  <a-card :bordered="false" class="stat-card">
    <div class="stat-label">{{ label }}</div>
    <div class="stat-value" :class="{ 'stat-value--warn': warnValue }">
      <EllipsisText :text="value" />
    </div>
    <div v-if="hasGrowth" class="stat-growth" :class="growthClass">
      {{ growthText }}
    </div>
  </a-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import EllipsisText from '@/components/common/EllipsisText.vue'
import { formatStatGrowth } from '@/utils/taskDisplay'

const props = defineProps<{
  label: string
  value: string
  /** 环比增量；传入时展示增长率行 */
  growth?: number
  growthSuffix?: string
  /** 主数值是否使用警告色 */
  warnValue?: boolean
}>()

/** 是否展示增长率行 */
const hasGrowth = computed(() => props.growth !== undefined)

const growthText = computed(() =>
  hasGrowth.value ? formatStatGrowth(props.growth ?? 0, props.growthSuffix ?? '') : '',
)

/** 增长为正绿色，为负红色 */
const growthClass = computed(() =>
  (props.growth ?? 0) >= 0 ? 'stat-growth--up' : 'stat-growth--down',
)
</script>

<style scoped>
.stat-card {
  height: 100%;
}

.stat-label {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.45);
  margin-bottom: 8px;
}

.stat-value {
  font-size: 30px;
  font-weight: 600;
  color: #4e5969;
  line-height: 1.2;
}

.stat-value :deep(.ant-typography) {
  font-size: inherit;
  font-weight: inherit;
  color: inherit;
  line-height: inherit;
}

.stat-value:last-child {
  margin-bottom: 0;
}

.stat-card:has(.stat-growth) .stat-value {
  margin-bottom: 8px;
}

.stat-value--warn,
.stat-value--warn :deep(.ant-typography) {
  color: #faad14;
}

.stat-growth {
  font-size: 13px;
}

.stat-growth--up {
  color: #52c41a;
}

.stat-growth--down {
  color: #ff4d4f;
}
</style>
