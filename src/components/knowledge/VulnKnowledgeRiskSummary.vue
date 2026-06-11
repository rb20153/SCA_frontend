<template>
  <ChartPlaceholder
    class="vuln-risk-summary"
    title="风险摘要"
    description="高危 / 中危 / 低危来源分布（图表待接入）"
  />
</template>

<script setup lang="ts">
import ChartPlaceholder from '@/components/dashboard/ChartPlaceholder.vue'
</script>

<style scoped>
.vuln-risk-summary {
  margin-bottom: 16px;
}
</style>
