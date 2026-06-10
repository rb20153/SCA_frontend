<template>
  <ListTable
    :columns="columns"
    :data-source="alerts"
    :loading="loading"
    :pagination="pagination"
    :scroll-x="ALERT_TABLE_SCROLL_X"
    row-key="alertId"
  >
    <template #bodyCell="{ column, record: row, text }">
      <template v-if="column.key === 'level'">
        <a-tag :color="ALERT_LEVEL_COLOR[getAlert(row).level]" class="list-table-status-tag">
          {{ ALERT_LEVEL_LABEL[getAlert(row).level] }}
        </a-tag>
      </template>

      <template v-else-if="column.key === 'occurredAt'">
        {{ formatAlertDateTime(getAlert(row).occurredAt) }}
      </template>

      <template v-else-if="column.key === 'handledAt'">
        {{ formatAlertDateTime(getAlert(row).handledAt ?? '') }}
      </template>

      <template v-else-if="column.key === 'status'">
        <a-tag color="warning">未处理</a-tag>
      </template>

      <template v-else-if="column.key === 'action'">
        <AlertActionCell
          :alert="getAlert(row)"
          :queue-status="queueStatus"
          @detail="(alert) => emit('detail', alert)"
        />
      </template>

      <ListTableCell v-else :column="column" :text="text" />
    </template>
  </ListTable>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue'
import type { AlertListItem, AlertQueueStatus } from '@/types/system'
import ListTable from '@/components/common/ListTable.vue'
import ListTableCell from '@/components/common/ListTableCell.vue'
import AlertActionCell from '@/components/system/AlertActionCell.vue'
import {
  ALERT_LEVEL_COLOR,
  ALERT_LEVEL_LABEL,
  ALERT_TABLE_SCROLL_X,
  formatAlertDateTime,
} from '@/utils/alertDisplay'

const props = defineProps<{
  alerts: AlertListItem[]
  queueStatus: AlertQueueStatus
  loading?: boolean
  pagination: TablePaginationConfig
}>()

const emit = defineEmits<{
  detail: [alert: AlertListItem]
}>()

/** a-table bodyCell 的 record 收窄为 AlertListItem */
function getAlert(row: unknown): AlertListItem {
  return row as AlertListItem
}

/** 未处理 / 已处理使用不同列定义 */
const columns = computed<TableColumnsType<AlertListItem>>(() => {
  if (props.queueStatus === 'handled') {
    return [
      { title: '级别', key: 'level', width: 100 },
      { title: '标题', key: 'title', dataIndex: 'title', width: 200, ellipsis: true },
      { title: '来源模块', key: 'sourceModule', dataIndex: 'sourceModule', width: 120, ellipsis: true },
      { title: '处理时间', key: 'handledAt', width: 160 },
      { title: '处理人', key: 'handlerName', dataIndex: 'handlerName', width: 100, ellipsis: true },
      { title: '操作', key: 'action', width: 100 },
    ]
  }

  return [
    { title: '级别', key: 'level', width: 100 },
    { title: '标题', key: 'title', dataIndex: 'title', width: 200, ellipsis: true },
    { title: '来源模块', key: 'sourceModule', dataIndex: 'sourceModule', width: 120, ellipsis: true },
    { title: '时间', key: 'occurredAt', width: 160 },
    { title: '状态', key: 'status', width: 100 },
    { title: '操作', key: 'action', width: 140 },
  ]
})
</script>
