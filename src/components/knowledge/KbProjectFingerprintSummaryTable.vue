<template>
  <ListTable
    :columns="columns"
    :data-source="dataSource"
    :loading="loading"
    :pagination="pagination"
    row-key="rowId"
  >
    <template #bodyCell="{ column, record, text }">
      <template v-if="column.key === 'maxConfidence'">
        {{ formatKbProjectConfidence((record as KbProjectFingerprintSummaryRow).maxConfidence) }}
      </template>
      <template v-else>
        {{ text }}
      </template>
    </template>
  </ListTable>
</template>

<script setup lang="ts">
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue'
import ListTable from '@/components/common/ListTable.vue'
import type { KbProjectFingerprintSummaryRow } from '@/types/knowledge'
import { formatKbProjectConfidence } from '@/utils/kbProjectDirectoryDisplay'

defineProps<{
  dataSource: KbProjectFingerprintSummaryRow[]
  loading?: boolean
}>()

/** 指纹与来源摘要表格列 */
const columns: TableColumnsType<KbProjectFingerprintSummaryRow> = [
  { title: '维度', dataIndex: 'dimension', key: 'dimension', width: 120 },
  { title: '命中数', dataIndex: 'hitCount', key: 'hitCount', width: 88 },
  { title: '最高置信度', dataIndex: 'maxConfidence', key: 'maxConfidence', width: 120 },
  { title: '说明', dataIndex: 'description', key: 'description', ellipsis: true },
]

/** 前端分页：每页 3 行 */
const pagination: TablePaginationConfig = {
  pageSize: 3,
  showSizeChanger: false,
  size: 'small',
  showTotal: (total) => `共 ${total} 条`,
}
</script>
