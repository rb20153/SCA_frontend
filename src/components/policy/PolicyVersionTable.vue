<template>
  <ListTable
    :columns="columns"
    :data-source="versions"
    :loading="loading"
    :pagination="pagination"
    :scroll-x="POLICY_VERSION_TABLE_SCROLL_X"
    :row-key="getVersionRowKey"
  >
    <template #bodyCell="{ column, record: row, text }">
      <template v-if="column.key === 'status'">
        <a-tag
          :color="POLICY_VERSION_STATUS_COLOR[getVersion(row).status]"
          class="list-table-status-tag"
        >
          {{ POLICY_VERSION_STATUS_LABEL[getVersion(row).status] }}
        </a-tag>
      </template>

      <template v-else-if="column.key === 'createdAt'">
        {{ formatPolicyVersionDateTime(getVersion(row).createdAt) }}
      </template>

      <template v-else-if="column.key === 'action'">
        <PolicyVersionActionCell
          :key="`${getVersion(row).versionId}-${getVersion(row).status}`"
          :version="getVersion(row)"
          @diff="(version) => emit('diff', version)"
          @approve="(version) => emit('approve', version)"
          @export="(version) => emit('export', version)"
          @rollback="(version) => emit('rollback', version)"
        />
      </template>

      <ListTableCell v-else :column="column" :text="text" />
    </template>
  </ListTable>
</template>

<script setup lang="ts">
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue'
import type { PolicyVersionListItem } from '@/types/policy'
import ListTable from '@/components/common/ListTable.vue'
import ListTableCell from '@/components/common/ListTableCell.vue'
import PolicyVersionActionCell from '@/components/policy/PolicyVersionActionCell.vue'
import {
  POLICY_VERSION_STATUS_COLOR,
  POLICY_VERSION_STATUS_LABEL,
  POLICY_VERSION_TABLE_SCROLL_X,
  formatPolicyVersionDateTime,
} from '@/utils/policyVersionDisplay'

defineProps<{
  versions: PolicyVersionListItem[]
  loading?: boolean
  pagination: TablePaginationConfig
}>()

const emit = defineEmits<{
  diff: [version: PolicyVersionListItem]
  approve: [version: PolicyVersionListItem]
  export: [version: PolicyVersionListItem]
  rollback: [version: PolicyVersionListItem]
}>()

/** a-table bodyCell 的 record 收窄为 PolicyVersionListItem */
function getVersion(row: unknown): PolicyVersionListItem {
  return row as PolicyVersionListItem
}

/** 行 key 含状态，回滚/审批后操作列随 status 重渲染 */
function getVersionRowKey(record: unknown): string {
  const version = getVersion(record)
  return `${version.versionId}-${version.status}`
}

const columns: TableColumnsType<PolicyVersionListItem> = [
  { title: '版本', key: 'versionNo', dataIndex: 'versionNo', width: 120, ellipsis: true },
  { title: '状态', key: 'status', width: 100 },
  { title: '创建人', key: 'creatorName', dataIndex: 'creatorName', width: 120, ellipsis: true },
  { title: '创建时间', key: 'createdAt', width: 160 },
  { title: '变更摘要', key: 'changeSummary', dataIndex: 'changeSummary', width: 260, ellipsis: true },
  { title: '操作', key: 'action', width: 220 },
]
</script>
