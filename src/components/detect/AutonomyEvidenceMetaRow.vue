<template>
  <div class="evidence-meta">
    <a-tag :color="alertColor">{{ alertLabel }}</a-tag>
    <span class="meta-item">置信度：{{ formattedConfidence }}</span>
    <span class="meta-item">来源项目：{{ sourceProject }}</span>
    <span class="meta-item">来源版本：{{ sourceVersion }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  /** 告警类型 Tag 文案 */
  alertLabel: string
  /** 告警类型 Tag 颜色 */
  alertColor: string
  /** 置信度 0–1 */
  confidence: number
  sourceProject: string
  sourceVersion: string
}>()

/** 置信度保留两位小数 */
const formattedConfidence = computed(() => props.confidence.toFixed(2))
</script>

<style scoped>
.evidence-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 16px;
  margin-bottom: 12px;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.88);
}

.meta-item {
  white-space: nowrap;
}
</style>
