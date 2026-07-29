<template>
  <ListTable
    :columns="columns"
    :data-source="alerts"
    :loading="loading"
    :pagination="pagination"
    :scroll-x="ALERT_TABLE_SCROLL_X"
    :row-class-name="rowClassName"
    row-key="alertId"
  >
    <template #bodyCell="{ column, record: row, text }">
      <template v-if="column.key === 'level'">
        <a-tag :color="ALERT_LEVEL_COLOR[getAlert(row).level]" class="list-table-status-tag">
          {{ ALERT_LEVEL_LABEL[getAlert(row).level] }}
        </a-tag>
      </template>

      <template v-else-if="column.key === 'title'">
        <span class="alert-title-cell">
          <span
            v-if="queueStatus === 'pending' && isAlertUnread(getAlert(row))"
            class="alert-unread-dot"
            title="未读"
          />
          <span
            :class="{
              'alert-title--unread':
                queueStatus === 'pending' && isAlertUnread(getAlert(row)),
            }"
          >
            {{ getAlert(row).title }}
          </span>
        </span>
      </template>

      <template v-else-if="column.key === 'occurredAt'">
        {{ formatAlertDateTime(getAlert(row).occurredAt) }}
      </template>

      <template v-else-if="column.key === 'handledAt'">
        {{ formatAlertDateTime(getAlert(row).handledAt ?? '') }}
      </template>

      <template v-else-if="column.key === 'status'">
        <a-tag v-if="getAlert(row).status === 'pending'" color="warning">未处理</a-tag>
        <a-tag v-else color="success">已处理</a-tag>
      </template>

      <template v-else-if="column.key === 'action'">
        <AlertActionCell
          :alert="getAlert(row)"
          :queue-status="queueStatus"
          @detail="(alert) => emit('detail', alert)"
          @handle="(alert) => emit('handle', alert)"
          @timeline="(alert) => emit('timeline', alert)"
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
  handle: [alert: AlertListItem]
  timeline: [alert: AlertListItem]
}>()

/** a-table bodyCell 的 record 收窄为 AlertListItem */
function getAlert(row: unknown): AlertListItem {
  return row as AlertListItem
}

/** 未处理且未读（isRead 缺省视为未读） */
function isAlertUnread(alert: AlertListItem): boolean {
  return !alert.isRead
}

/** 未处理未读行蓝底高亮 */
function rowClassName(record: AlertListItem): string {
  if (props.queueStatus !== 'pending' || !isAlertUnread(record)) {
    return ''
  }
  return 'alert-row--unread'
}

/** 未处理 / 已处理使用不同列定义 */
const columns = computed<TableColumnsType<AlertListItem>>(() => {
  if (props.queueStatus === 'handled') {
    return [
      { title: '级别', key: 'level', width: 100 },
      { title: '标题', key: 'title', dataIndex: 'title', width: 200, ellipsis: true },
      {
        title: '来源模块',
        key: 'sourceModule',
        dataIndex: 'sourceModule',
        width: 120,
        ellipsis: true,
      },
      { title: '处理时间', key: 'handledAt', width: 160 },
      {
        title: '处理人',
        key: 'handlerName',
        dataIndex: 'handlerName',
        width: 100,
        ellipsis: true,
      },
      { title: '状态', key: 'status', width: 100 },
      { title: '操作', key: 'action', width: 160, fixed: 'right' },
    ]
  }

  return [
    { title: '级别', key: 'level', width: 100 },
    { title: '标题', key: 'title', dataIndex: 'title', width: 220, ellipsis: true },
    {
      title: '来源模块',
      key: 'sourceModule',
      dataIndex: 'sourceModule',
      width: 120,
      ellipsis: true,
    },
    { title: '时间', key: 'occurredAt', width: 160 },
    { title: '状态', key: 'status', width: 100 },
    { title: '操作', key: 'action', width: 140, fixed: 'right' },
  ]
})
</script>

<style scoped>
.alert-title-cell {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  max-width: 100%;
}

.alert-title--unread {
  font-weight: 600;
}

.alert-unread-dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #1677ff;
}
</style>

<style>
.alert-row--unread > td {
  background-color: #e6f4ff !important;
}

.alert-row--unread:hover > td {
  background-color: #bae0ff !important;
}
</style>
