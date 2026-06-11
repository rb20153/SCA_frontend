<template>
  <a-card
    :title="title"
    :bordered="false"
    class="chart-placeholder"
    :class="{
      'chart-placeholder--flat-bottom': flatBottom,
      'chart-placeholder--flex-body': flexBody,
    }"
  >
    <div class="chart-placeholder__body">
      <a-empty :description="description" />
    </div>
  </a-card>
</template>

<script setup lang="ts">
defineProps<{
  /** 卡片标题；不传则不显示标题栏 */
  title?: string
  description?: string
  /** 与下方表格拼接时去掉底部圆角 */
  flatBottom?: boolean
  /** 在 flex 容器内占满剩余高度（用于左右栏底部对齐） */
  flexBody?: boolean
}>()
</script>

<style scoped>
.chart-placeholder {
  height: 100%;
}

.chart-placeholder--flat-bottom {
  border-radius: 0;
  box-shadow: none;
}

.chart-placeholder--flat-bottom :deep(.ant-card) {
  border-radius: 0;
}

.chart-placeholder--flat-bottom :deep(.ant-card-body) {
  padding-bottom: 0;
}

.chart-placeholder--flex-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.chart-placeholder--flex-body :deep(.ant-card-body) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.chart-placeholder--flex-body .chart-placeholder__body {
  flex: 1;
  min-height: 280px;
  height: auto;
}

.chart-placeholder__body {
  height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
