<template>
  <a-card :bordered="false" class="stat-card">
    <div class="stat-label">{{ label }}</div>
    <div class="stat-value" :class="{ 'stat-value--warn': warnValue }">
      {{ displayValue }}
    </div>
    <div class="stat-growth" :class="growthClass">
      {{ growthText }}
    </div>
  </a-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatStatGrowth } from '@/utils/taskDisplay'

const props = defineProps<{
  label: string
  value: number
  suffix?: string
  growth: number
  growthSuffix?: string
  warnValue?: boolean
}>()

const displayValue = computed(() => `${props.value}${props.suffix ?? ''}`)

const growthText = computed(() => formatStatGrowth(props.growth, props.growthSuffix ?? ''))

/** 增长为正绿色，为负红色 */
const growthClass = computed(() =>
  props.growth >= 0 ? 'stat-growth--up' : 'stat-growth--down',
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
  color: rgba(0, 0, 0, 0.88);
  line-height: 1.2;
  margin-bottom: 8px;
}

.stat-value--warn {
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
