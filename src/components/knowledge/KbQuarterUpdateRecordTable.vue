<template>
  <ListTable
    :columns="columns"
    :data-source="records"
    :loading="loading"
    :pagination="pagination"
    :scroll-x="KB_QUARTER_UPDATE_TABLE_SCROLL_X"
    row-key="recordId"
  >
    <template #bodyCell="{ column, record: row, text }">
      <template v-if="column.key === 'collectMode'">
        {{ KB_QUARTER_UPDATE_COLLECT_MODE_LABEL[getRecord(row).collectMode] }}
      </template>

      <template v-else-if="column.key === 'status'">
        <a-tag
          :color="KB_QUARTER_UPDATE_STATUS_COLOR[getRecord(row).status]"
          class="list-table-status-tag"
        >
          {{ KB_QUARTER_UPDATE_STATUS_LABEL[getRecord(row).status] }}
        </a-tag>
      </template>

      <template v-else-if="column.key === 'updatedAt'">
        {{ formatKbQuarterUpdateDateTime(getRecord(row).updatedAt) }}
      </template>

      <ListTableCell v-else :column="column" :text="text" />
    </template>
  </ListTable>
</template>

<script setup lang="ts">
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue'
import type { KbQuarterUpdateRecord } from '@/types/knowledge'
import ListTable from '@/components/common/ListTable.vue'
import ListTableCell from '@/components/common/ListTableCell.vue'
import {
  KB_QUARTER_UPDATE_COLLECT_MODE_LABEL,
  KB_QUARTER_UPDATE_STATUS_COLOR,
  KB_QUARTER_UPDATE_STATUS_LABEL,
  KB_QUARTER_UPDATE_TABLE_SCROLL_X,
  formatKbQuarterUpdateDateTime,
} from '@/utils/kbQuarterUpdateDisplay'

defineProps<{
  records: KbQuarterUpdateRecord[]
  loading?: boolean
  pagination: TablePaginationConfig
}>()

/** a-table bodyCell 的 record 为 unknown，收窄为 KbQuarterUpdateRecord */
function getRecord(row: unknown): KbQuarterUpdateRecord {
  return row as KbQuarterUpdateRecord
}

const columns: TableColumnsType<KbQuarterUpdateRecord> = [
  { title: '记录编号', key: 'recordId', dataIndex: 'recordId', width: 180, ellipsis: true },
  { title: '项目名', key: 'projectName', dataIndex: 'projectName', width: 120, ellipsis: true },
  { title: '季度', key: 'quarter', dataIndex: 'quarter', width: 100 },
  { title: '采集方式', key: 'collectMode', width: 110 },
  { title: '状态', key: 'status', width: 100 },
  { title: '更新时间', key: 'updatedAt', width: 160 },
]
</script>
