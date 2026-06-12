<template>
  <ListTable
    :columns="columns"
    :data-source="messages"
    :loading="loading"
    :pagination="pagination"
    :scroll-x="SITE_MESSAGE_TABLE_SCROLL_X"
    :row-class-name="rowClassName"
    row-key="messageId"
  >
    <template #bodyCell="{ column, record: row, text }">
      <template v-if="column.key === 'type'">
        <a-tag :color="SITE_MESSAGE_TYPE_COLOR[getMessage(row).type]" class="list-table-status-tag">
          {{ SITE_MESSAGE_TYPE_LABEL[getMessage(row).type] }}
        </a-tag>
      </template>

      <template v-else-if="column.key === 'title'">
        <span :class="{ 'message-title--unread': !getMessage(row).read }">
          {{ getMessage(row).title }}
        </span>
      </template>

      <template v-else-if="column.key === 'createdAt'">
        {{ formatSiteMessageDateTime(getMessage(row).createdAt) }}
      </template>

      <template v-else-if="column.key === 'action'">
        <SiteMessageActionCell
          :message="getMessage(row)"
          @action-click="(msg) => emit('action-click', msg)"
          @toggle-read="(msg, read) => emit('toggle-read', msg, read)"
        />
      </template>

      <ListTableCell v-else :column="column" :text="text" />
    </template>
  </ListTable>
</template>

<script setup lang="ts">
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue'
import type { SiteMessage } from '@/types/siteMessage'
import ListTable from '@/components/common/ListTable.vue'
import ListTableCell from '@/components/common/ListTableCell.vue'
import SiteMessageActionCell from '@/components/system/SiteMessageActionCell.vue'
import {
  SITE_MESSAGE_TABLE_SCROLL_X,
  SITE_MESSAGE_TYPE_COLOR,
  SITE_MESSAGE_TYPE_LABEL,
  formatSiteMessageDateTime,
} from '@/utils/siteMessageDisplay'

defineProps<{
  messages: SiteMessage[]
  loading?: boolean
  pagination: TablePaginationConfig
}>()

const emit = defineEmits<{
  'action-click': [message: SiteMessage]
  'toggle-read': [message: SiteMessage, read: boolean]
}>()

const columns: TableColumnsType<SiteMessage> = [
  { title: '类型', key: 'type', width: 110 },
  { title: '标题', key: 'title', dataIndex: 'title', width: 200, ellipsis: true },
  { title: '摘要', key: 'summary', dataIndex: 'summary', ellipsis: true },
  { title: '时间', key: 'createdAt', width: 170 },
  { title: '操作', key: 'action', width: 220, fixed: 'right' },
]

/** a-table bodyCell 的 record 收窄为 SiteMessage */
function getMessage(row: unknown): SiteMessage {
  return row as SiteMessage
}

/** 未读行高亮背景 */
function rowClassName(record: SiteMessage): string {
  return record.read ? '' : 'site-message-row--unread'
}
</script>

<style scoped>
.message-title--unread {
  font-weight: 600;
}
</style>

<style>
.site-message-row--unread > td {
  background-color: #e6f4ff !important;
}

.site-message-row--unread:hover > td {
  background-color: #bae0ff !important;
}
</style>
