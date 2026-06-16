<template>
  <ListTable
    :columns="columns"
    :data-source="versions"
    :loading="loading"
    :pagination="pagination"
    :scroll-x="KB_VERSION_TABLE_SCROLL_X"
    row-key="versionId"
  >
    <template #bodyCell="{ column, record: row, text }">
      <template v-if="column.key === 'status'">
        <a-tag
          :color="KB_VERSION_STATUS_COLOR[getVersion(row).status]"
          class="list-table-status-tag"
        >
          {{ KB_VERSION_STATUS_LABEL[getVersion(row).status] }}
        </a-tag>
      </template>

      <template v-else-if="column.key === 'createdAt'">
        {{ formatKbVersionDateTime(getVersion(row).createdAt) }}
      </template>

      <template v-else-if="column.key === 'action'">
        <KbVersionActionCell :version="getVersion(row)" :kb-project="kbProject" />
      </template>

      <ListTableCell v-else :column="column" :text="text" />
    </template>
  </ListTable>
</template>

<script setup lang="ts">
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue'
import type { KbProject, KbVersion } from '@/types/knowledge'
import ListTable from '@/components/common/ListTable.vue'
import ListTableCell from '@/components/common/ListTableCell.vue'
import KbVersionActionCell from '@/components/knowledge/KbVersionActionCell.vue'
import {
  KB_VERSION_STATUS_COLOR,
  KB_VERSION_STATUS_LABEL,
  KB_VERSION_TABLE_SCROLL_X,
  formatKbVersionDateTime,
} from '@/utils/knowledgeVersionDisplay'

defineProps<{
  versions: KbVersion[]
  loading?: boolean
  pagination: TablePaginationConfig
  /** 当前知识库项目，供操作列跳转目录时携带 */
  kbProject?: KbProject | null
}>()

/** a-table bodyCell 的 record 收窄为 KbVersion */
function getVersion(row: unknown): KbVersion {
  return row as KbVersion
}

const columns: TableColumnsType<KbVersion> = [
  { title: '版本号', key: 'versionNo', dataIndex: 'versionNo', width: 120, ellipsis: true },
  { title: '说明', key: 'description', dataIndex: 'description', width: 260, ellipsis: true },
  { title: '项目数', key: 'referencedProjectCount', dataIndex: 'referencedProjectCount', width: 90 },
  { title: '更新状态', key: 'status', width: 120 },
  { title: '创建时间', key: 'createdAt', width: 160 },
  { title: '操作', key: 'action', width: 200 },
]
</script>
