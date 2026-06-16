<template>
  <a-card :bordered="false" class="risk-component-graph">
    <h3 class="risk-component-graph__title">组件依赖关系图</h3>
    <div class="risk-component-graph__placeholder">
      <span class="risk-component-graph__hint">图表占位，后续接入 ECharts</span>
    </div>
  </a-card>
</template>

<script setup lang="ts">
// 依赖关系图占位，后续通过 useECharts 接入
</script>

<style scoped>
.risk-component-graph {
  margin-bottom: 16px;
}

.risk-component-graph__title {
  margin: 0 0 12px;
  font-size: 16px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.88);
}

.risk-component-graph__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 280px;
  background: #fafafa;
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
}

.risk-component-graph__hint {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.45);
}
</style>
