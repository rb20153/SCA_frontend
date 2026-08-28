<template>
  <ListTable
    :columns="(columns as TableColumnsType<Record<string, unknown>>)"
    :data-source="(sources as unknown as Record<string, unknown>[])"
    :loading="loading"
    :pagination="pagination"
    :scroll-x="VULN_SOURCE_TABLE_SCROLL_X"
    row-key="sourceId"
  >
    <template #bodyCell="{ column, record: row, text }">
      <template v-if="column.key === 'recordCount'">
        {{ formatVulnMetric(getSource(row).recordCount) }}
      </template>

      <template v-else-if="column.key === 'highRiskCount'">
        {{ formatVulnMetric(getSource(row).highRiskCount) }}
      </template>

      <template v-else-if="column.key === 'lastSyncedAt'">
        {{ formatVulnSourceLastSync(getSource(row)) }}
      </template>

      <template v-else-if="column.key === 'syncStatus'">
        <a-tag
          :color="VULN_SYNC_STATUS_COLOR[getSource(row).syncStatus]"
          class="list-table-status-tag"
        >
          {{ VULN_SYNC_STATUS_LABEL[getSource(row).syncStatus] }}
        </a-tag>
      </template>

      <template v-else-if="column.key === 'action'">
        <VulnSourceActionCell
          :source="getSource(row)"
          @sync="(source) => emit('sync', source)"
        />
      </template>

      <ListTableCell v-else :column="column" :text="text" />
    </template>
  </ListTable>
</template>

<script setup lang="ts">
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue'
import type { VulnSource } from '@/types/knowledge'
import ListTable from '@/components/common/ListTable.vue'
import ListTableCell from '@/components/common/ListTableCell.vue'
import VulnSourceActionCell from '@/components/knowledge/VulnSourceActionCell.vue'
import {
  formatVulnMetric,
  formatVulnSourceLastSync,
  VULN_SOURCE_TABLE_SCROLL_X,
  VULN_SYNC_STATUS_COLOR,
  VULN_SYNC_STATUS_LABEL,
} from '@/utils/vulnKnowledgeDisplay'

defineProps<{
  sources: VulnSource[]
  loading?: boolean
  pagination: TablePaginationConfig
}>()

const emit = defineEmits<{
  sync: [source: VulnSource]
}>()

/** a-table bodyCell 的 record 收窄为 VulnSource */
function getSource(row: unknown): VulnSource {
  return row as VulnSource
}

const columns: TableColumnsType<VulnSource> = [
  { title: '来源', key: 'sourceName', dataIndex: 'sourceName', width: 160, ellipsis: true },
  { title: '来源类型', key: 'sourceType', dataIndex: 'sourceType', width: 130, ellipsis: true },
  { title: '记录数', key: 'recordCount', width: 100 },
  { title: '高危数', key: 'highRiskCount', width: 90 },
  { title: '最近同步', key: 'lastSyncedAt', width: 160 },
  { title: '状态', key: 'syncStatus', width: 90 },
  { title: '操作', key: 'action', width: 160 },
]
</script>
