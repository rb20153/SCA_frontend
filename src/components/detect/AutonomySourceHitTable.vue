<template>
  <ListTable
    :columns="columns"
    :data-source="items"
    :loading="loading"
    :pagination="pagination"
    :scroll-x="AUTONOMY_SOURCE_HIT_TABLE_SCROLL_X"
    row-key="hitId"
  >
    <template #bodyCell="{ column, record: row, text }">
      <template v-if="column.key === 'hitFiles'">
        {{ formatAutonomySourceHitFileDisplay(getItem(row)) || '—' }}
      </template>

      <template v-else-if="column.key === 'riskLevel'">
        <a-tag
          :color="AUTONOMY_SOURCE_HIT_LEVEL_COLOR[getItem(row).riskLevel]"
          class="list-table-status-tag"
        >
          {{ AUTONOMY_SOURCE_HIT_LEVEL_LABEL[getItem(row).riskLevel] }}
        </a-tag>
      </template>

      <template v-else-if="column.key === 'action'">
        <a
          href="#"
          class="list-table-link"
          @click.prevent="emit('locate', getItem(row))"
        >
          定位
        </a>
      </template>

      <ListTableCell v-else :column="column" :text="text" />
    </template>
  </ListTable>
</template>

<script setup lang="ts">
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue'
import ListTable from '@/components/common/ListTable.vue'
import ListTableCell from '@/components/common/ListTableCell.vue'
import type { AutonomySourceHitItem } from '@/types/detect'
import {
  AUTONOMY_SOURCE_HIT_LEVEL_COLOR,
  AUTONOMY_SOURCE_HIT_LEVEL_LABEL,
  AUTONOMY_SOURCE_HIT_TABLE_SCROLL_X,
  formatAutonomySourceHitFileDisplay,
} from '@/utils/autonomyDetectResultDisplay'

defineProps<{
  items: AutonomySourceHitItem[]
  loading?: boolean
  pagination: TablePaginationConfig
}>()

const emit = defineEmits<{
  /** 定位至文件证据 Tab 并高亮首个命中文件 */
  locate: [item: AutonomySourceHitItem]
}>()

const columns: TableColumnsType<AutonomySourceHitItem> = [
  { title: '来源知识库项目', dataIndex: 'kbProjectName', key: 'kbProjectName', width: 160 },
  { title: '来源版本', dataIndex: 'kbVersion', key: 'kbVersion', width: 120 },
  { title: '命中文件', key: 'hitFiles', width: 200 },
  { title: '许可证', dataIndex: 'license', key: 'license', width: 120 },
  { title: '风险等级', key: 'riskLevel', width: 100 },
  { title: '操作', key: 'action', width: 80, fixed: 'right' },
]

/** 将表格行 record 收窄为来源汇总项 */
function getItem(record: unknown): AutonomySourceHitItem {
  return record as AutonomySourceHitItem
}
</script>
