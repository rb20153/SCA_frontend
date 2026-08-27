<template>
  <ListTable
    :columns="columns"
    :data-source="items"
    :loading="loading"
    :pagination="pagination"
    :scroll-x="KB_INTAKE_TODO_TABLE_SCROLL_X"
    row-key="todoId"
  >
    <template #bodyCell="{ column, record: row, text }">
      <template v-if="column.key === 'status'">
        <a-tag
          :color="KB_INTAKE_TODO_STATUS_COLOR[getItem(row).status]"
          class="list-table-status-tag"
        >
          {{ KB_INTAKE_TODO_STATUS_LABEL[getItem(row).status] }}
        </a-tag>
      </template>

      <template v-else-if="column.key === 'detail'">
        <EllipsisText :text="getItem(row).detail" />
      </template>

      <ListTableCell v-else :column="column" :text="text" />
    </template>
  </ListTable>
</template>

<script setup lang="ts">
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue'
import EllipsisText from '@/components/common/EllipsisText.vue'
import ListTable from '@/components/common/ListTable.vue'
import ListTableCell from '@/components/common/ListTableCell.vue'
import type { KbIntakeTodoItem } from '@/types/knowledge'
import {
  KB_INTAKE_TODO_STATUS_COLOR,
  KB_INTAKE_TODO_STATUS_LABEL,
} from '@/utils/knowledgeDisplay'

/** 入库待办表格横向滚动宽度 */
const KB_INTAKE_TODO_TABLE_SCROLL_X = 520

defineProps<{
  items: KbIntakeTodoItem[]
  loading?: boolean
  pagination: TablePaginationConfig
}>()

/** a-table bodyCell 的 record 收窄为 KbIntakeTodoItem */
function getItem(row: unknown): KbIntakeTodoItem {
  return row as KbIntakeTodoItem
}

/** 入库待办表格列 */
const columns: TableColumnsType<KbIntakeTodoItem> = [
  {
    title: '项目',
    key: 'projectName',
    dataIndex: 'projectName',
    width: 196,
    ellipsis: true,
  },
  { title: '状态', key: 'status', width: 88 },
  {
    title: '详情',
    key: 'detail',
    dataIndex: 'detail',
    width: 236,
    ellipsis: true,
  },
]
</script>
