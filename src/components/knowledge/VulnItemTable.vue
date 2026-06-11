<template>
  <ListTable
    :columns="columns"
    :data-source="items"
    :loading="loading"
    :pagination="pagination"
    :scroll-x="VULN_ITEM_TABLE_SCROLL_X"
    row-key="itemId"
  >
    <template #bodyCell="{ column, record: row, text }">
      <template v-if="column.key === 'level'">
        <a-tag :color="VULN_ITEM_LEVEL_COLOR[getItem(row).level]" class="list-table-status-tag">
          {{ VULN_ITEM_LEVEL_LABEL[getItem(row).level] }}
        </a-tag>
      </template>

      <template v-else-if="column.key === 'updatedAt'">
        {{ formatVulnItemDateTime(getItem(row).updatedAt) }}
      </template>

      <template v-else-if="column.key === 'status'">
        <a-tag :color="VULN_ITEM_STATUS_COLOR[getItem(row).status]" class="list-table-status-tag">
          {{ VULN_ITEM_STATUS_LABEL[getItem(row).status] }}
        </a-tag>
      </template>

      <template v-else-if="column.key === 'action'">
        <a href="#" class="list-table-link" @click.prevent="emit('detail', getItem(row))">详情</a>
      </template>

      <ListTableCell v-else :column="column" :text="text" />
    </template>
  </ListTable>
</template>

<script setup lang="ts">
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue'
import type { VulnItemListItem } from '@/types/knowledge'
import ListTable from '@/components/common/ListTable.vue'
import ListTableCell from '@/components/common/ListTableCell.vue'
import {
  formatVulnItemDateTime,
  VULN_ITEM_LEVEL_COLOR,
  VULN_ITEM_LEVEL_LABEL,
  VULN_ITEM_STATUS_COLOR,
  VULN_ITEM_STATUS_LABEL,
  VULN_ITEM_TABLE_SCROLL_X,
} from '@/utils/vulnItemDisplay'

defineProps<{
  items: VulnItemListItem[]
  loading?: boolean
  pagination: TablePaginationConfig
}>()

const emit = defineEmits<{
  detail: [item: VulnItemListItem]
}>()

/** a-table bodyCell 的 record 收窄为 VulnItemListItem */
function getItem(row: unknown): VulnItemListItem {
  return row as VulnItemListItem
}

const columns: TableColumnsType<VulnItemListItem> = [
  { title: '编号', key: 'identifier', dataIndex: 'identifier', width: 160, ellipsis: true },
  { title: '来源', key: 'sourceName', dataIndex: 'sourceName', width: 120, ellipsis: true },
  { title: '等级', key: 'level', width: 88 },
  {
    title: '影响组件',
    key: 'affectedComponent',
    dataIndex: 'affectedComponent',
    width: 200,
    ellipsis: true,
  },
  { title: '更新时间', key: 'updatedAt', width: 160 },
  { title: '状态', key: 'status', width: 100 },
  { title: '操作', key: 'action', width: 80 },
]
</script>
