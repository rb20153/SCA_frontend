<template>
  <a-spin :spinning="loading" class="coverage-stat-table-wrap">
    <a-empty v-if="!loading && dataSource.length === 0" description="暂无数据" />
    <a-table
      v-else
      :columns="columns"
      :data-source="dataSource"
      :pagination="false"
      :row-key="rowKey"
      bordered
      size="middle"
      class="coverage-stat-table"
    />
  </a-spin>
</template>

<script setup lang="ts">
import type { TableColumnsType } from 'ant-design-vue'

defineProps<{
  columns: TableColumnsType
  dataSource: unknown[]
  loading?: boolean
  rowKey: string
}>()
</script>

<style scoped>
.coverage-stat-table-wrap :deep(.ant-spin-container) {
  display: block;
}

.coverage-stat-table :deep(.ant-table-wrapper),
.coverage-stat-table :deep(.ant-table),
.coverage-stat-table :deep(.ant-table-container),
.coverage-stat-table :deep(.ant-table-content),
.coverage-stat-table :deep(table),
.coverage-stat-table :deep(thead > tr > th),
.coverage-stat-table :deep(tbody > tr > td) {
  border-radius: 0 !important;
}

.coverage-stat-table :deep(.ant-table-container) {
  border: none;
}

.coverage-stat-table :deep(.ant-table-thead > tr > th:first-child),
.coverage-stat-table :deep(.ant-table-tbody > tr > td:first-child) {
  border-left: none;
}

.coverage-stat-table :deep(.ant-table-thead > tr > th:last-child),
.coverage-stat-table :deep(.ant-table-tbody > tr > td:last-child) {
  border-right: none;
}

.coverage-stat-table :deep(.ant-table-thead > tr > th) {
  border-top: none;
  text-align: center;
  background: #fafafa;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.88);
}

.coverage-stat-table :deep(.ant-table-tbody > tr:last-child > td) {
  border-bottom: none;
}

.coverage-stat-table :deep(.ant-table-tbody > tr > td) {
  text-align: center;
}

.coverage-stat-table :deep(.ant-table-tbody > tr > td:first-child) {
  background: #fafafa;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.88);
}
</style>
