<template>
  <ListTable
    :columns="columns"
    :data-source="items"
    :loading="loading"
    :pagination="pagination"
    row-key="pendingId"
  >
    <template #bodyCell="{ column, record: row, text }">
      <template v-if="column.key === 'impact'">
        <a-tag
          :color="COVERAGE_GAP_IMPACT_COLOR[getItem(row).impact]"
          class="list-table-status-tag"
        >
          {{ COVERAGE_GAP_IMPACT_LABEL[getItem(row).impact] }}
        </a-tag>
      </template>

      <template v-else-if="column.key === 'action'">
        <CoveragePendingActionCell :item="getItem(row)" />
      </template>

      <ListTableCell v-else :column="column" :text="text" />
    </template>
  </ListTable>
</template>

<script setup lang="ts">
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue'
import type { CoveragePendingItem } from '@/types/knowledge'
import ListTable from '@/components/common/ListTable.vue'
import ListTableCell from '@/components/common/ListTableCell.vue'
import CoveragePendingActionCell from '@/components/knowledge/CoveragePendingActionCell.vue'
import {
  COVERAGE_GAP_IMPACT_COLOR,
  COVERAGE_GAP_IMPACT_LABEL,
} from '@/utils/coverageDisplay'

defineProps<{
  items: CoveragePendingItem[]
  loading?: boolean
  pagination: TablePaginationConfig
}>()

/** a-table bodyCell 的 record 收窄为 CoveragePendingItem */
function getItem(row: unknown): CoveragePendingItem {
  return row as CoveragePendingItem
}

const columns: TableColumnsType<CoveragePendingItem> = [
  {
    title: '项目名称',
    key: 'projectName',
    dataIndex: 'projectName',
    width: 96,
    ellipsis: true,
  },
  {
    title: '缺口',
    key: 'gapDescription',
    dataIndex: 'gapDescription',
    width: 112,
    ellipsis: true,
  },
  { title: '影响', key: 'impact', width: 72 },
  {
    title: '建议动作',
    key: 'suggestedAction',
    dataIndex: 'suggestedAction',
    width: 112,
    ellipsis: true,
  },
  { title: '操作', key: 'action', width: 64 },
]
</script>
