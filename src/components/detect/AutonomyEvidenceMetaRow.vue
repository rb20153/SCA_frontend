<template>
  <div class="evidence-meta">
    <a-tag :color="alertColor">{{ alertLabel }}</a-tag>
    <span class="meta-item">置信度：{{ formattedConfidence }}</span>
    <span class="meta-item">
      来源项目：
      <a
        v-if="sourceUrl"
        class="source-link"
        :href="sourceUrl"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ sourceProject }}
      </a>
      <template v-else>{{ sourceProject }}</template>
    </span>
    <span class="meta-item">来源版本：{{ sourceVersion }}</span>
    <span v-if="license" class="meta-item">License：{{ license }}</span>
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
  /** 来源仓库链接，有值时来源项目可点击跳转 */
  sourceUrl?: string
  sourceVersion: string
  /** 命中来源许可证，为空时不展示 */
  license?: string
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

.source-link {
  color: #1677ff;
  text-decoration: none;
}

.source-link:hover {
  text-decoration: underline;
}
</style>
