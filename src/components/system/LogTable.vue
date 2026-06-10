<template>
  <ListTable
    :columns="(columns as TableColumnsType<Record<string, unknown>>)"
    :data-source="(logs as unknown as Record<string, unknown>[])"
    :loading="loading"
    :pagination="pagination"
    :scroll-x="LOG_TABLE_SCROLL_X"
    row-key="logId"
  >
    <template #bodyCell="{ column, record: row, text }">
      <template v-if="column.key === 'occurredAt'">
        {{ formatLogDateTime(getLog(row).occurredAt) }}
      </template>

      <template v-else-if="column.key === 'result'">
        <a-tag :color="LOG_RESULT_COLOR[getLog(row).result]" class="list-table-status-tag">
          {{ LOG_RESULT_LABEL[getLog(row).result] }}
        </a-tag>
      </template>

      <template v-else-if="column.key === 'action'">
        <LogActionCell :log="getLog(row)" @detail="(log) => emit('detail', log)" />
      </template>

      <ListTableCell v-else :column="column" :text="text" />
    </template>
  </ListTable>
</template>

<script setup lang="ts">
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue'
import type { LogListItem } from '@/types/system'
import ListTable from '@/components/common/ListTable.vue'
import ListTableCell from '@/components/common/ListTableCell.vue'
import LogActionCell from '@/components/system/LogActionCell.vue'
import {
  formatLogDateTime,
  LOG_RESULT_COLOR,
  LOG_RESULT_LABEL,
  LOG_TABLE_SCROLL_X,
} from '@/utils/logDisplay'

defineProps<{
  logs: LogListItem[]
  loading?: boolean
  pagination: TablePaginationConfig
}>()

const emit = defineEmits<{
  detail: [log: LogListItem]
}>()

/** a-table bodyCell 的 record 收窄为 LogListItem */
function getLog(row: unknown): LogListItem {
  return row as LogListItem
}

const columns: TableColumnsType<LogListItem> = [
  { title: 'TraceID', key: 'traceId', dataIndex: 'traceId', width: 180, ellipsis: true },
  { title: '时间', key: 'occurredAt', width: 170 },
  { title: '用户', key: 'username', dataIndex: 'username', width: 100, ellipsis: true },
  { title: '模块', key: 'module', dataIndex: 'module', width: 120, ellipsis: true },
  { title: '操作', key: 'operation', dataIndex: 'operation', width: 120, ellipsis: true },
  { title: '资源/对象', key: 'resourceObject', dataIndex: 'resourceObject', width: 160, ellipsis: true },
  { title: 'IP', key: 'ip', dataIndex: 'ip', width: 120, ellipsis: true },
  { title: '结果', key: 'result', width: 90 },
  { title: '详情', key: 'action', width: 110 },
]
</script>
