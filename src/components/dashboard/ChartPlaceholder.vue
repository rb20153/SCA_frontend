<template>
  <a-card :title="title" :bordered="false" class="chart-placeholder">
    <div class="chart-placeholder__body">
      <a-empty :description="description" />
    </div>
  </a-card>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<style scoped>
.chart-placeholder {
  height: 100%;
}

.chart-placeholder__body {
  height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
