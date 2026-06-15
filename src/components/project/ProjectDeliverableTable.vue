<template>
  <ListTable
    :columns="columns"
    :data-source="deliverables"
    :loading="loading"
    :pagination="pagination"
    :scroll-x="PROJECT_DELIVERABLE_TABLE_SCROLL_X"
    row-key="deliverableId"
  >
    <template #bodyCell="{ column, record: row, text }">
      <template v-if="column.key === 'sourceMode'">
        {{ DELIVERABLE_SOURCE_MODE_LABEL[getDeliverable(row).sourceMode] }}
      </template>

      <template v-else-if="column.key === 'deliverableType'">
        <a-tag :color="DELIVERABLE_TYPE_COLOR[getDeliverable(row).deliverableType]">
          {{ DELIVERABLE_TYPE_LABEL[getDeliverable(row).deliverableType] }}
        </a-tag>
      </template>

      <template v-else-if="column.key === 'sizeBytes'">
        {{
          formatDeliverableSize(
            getDeliverable(row).sizeBytes,
            getDeliverable(row).sourceMode,
          )
        }}
      </template>

      <template v-else-if="column.key === 'uploadedAt'">
        {{ formatDeliverableUploadedAt(getDeliverable(row).uploadedAt) }}
      </template>

      <template v-else-if="column.key === 'action'">
        <ProjectDeliverableActionCell
          :deliverable="getDeliverable(row)"
          :downloading="downloadingId === getDeliverable(row).deliverableId"
          @view-source="(item) => emit('view-source', item)"
          @download="(item) => emit('download', item)"
          @delete="(item) => emit('delete', item)"
        />
      </template>

      <ListTableCell v-else :column="column" :text="text" />
    </template>
  </ListTable>
</template>

<script setup lang="ts">
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue'
import type { ProjectDeliverable } from '@/types/project'
import ListTable from '@/components/common/ListTable.vue'
import ListTableCell from '@/components/common/ListTableCell.vue'
import ProjectDeliverableActionCell from '@/components/project/ProjectDeliverableActionCell.vue'
import {
  DELIVERABLE_SOURCE_MODE_LABEL,
  DELIVERABLE_TYPE_COLOR,
  DELIVERABLE_TYPE_LABEL,
  PROJECT_DELIVERABLE_TABLE_SCROLL_X,
  formatDeliverableSize,
  formatDeliverableUploadedAt,
} from '@/utils/projectDeliverableDisplay'

defineProps<{
  deliverables: ProjectDeliverable[]
  loading?: boolean
  pagination: TablePaginationConfig
  downloadingId?: string | null
}>()

const emit = defineEmits<{
  'view-source': [deliverable: ProjectDeliverable]
  download: [deliverable: ProjectDeliverable]
  delete: [deliverable: ProjectDeliverable]
}>()

/** a-table bodyCell 的 record 为 unknown，收窄为 ProjectDeliverable */
function getDeliverable(row: unknown): ProjectDeliverable {
  return row as ProjectDeliverable
}

const columns: TableColumnsType<ProjectDeliverable> = [
  { title: '交付物', key: 'name', dataIndex: 'name', width: 180, ellipsis: true },
  { title: '来源方式', key: 'sourceMode', width: 130 },
  { title: '类型', key: 'deliverableType', width: 90 },
  { title: '大小', key: 'sizeBytes', width: 100 },
  { title: 'MD5', key: 'md5', dataIndex: 'md5', width: 200, ellipsis: true },
  { title: '上传人', key: 'uploaderName', dataIndex: 'uploaderName', width: 100, ellipsis: true },
  { title: '上传时间', key: 'uploadedAt', width: 170 },
  { title: '操作', key: 'action', width: 160 },
]
</script>
