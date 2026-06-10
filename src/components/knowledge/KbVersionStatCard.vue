<template>
  <a-card :bordered="false" class="stat-card">
    <div class="stat-label">{{ label }}</div>
    <div class="stat-value">{{ value }}</div>
  </a-card>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  value: string
}>()
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
  word-break: break-all;
}
</style>
