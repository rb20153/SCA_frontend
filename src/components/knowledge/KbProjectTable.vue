<template>
  <ListTable
    :columns="columns"
    :data-source="projects"
    :loading="loading"
    :pagination="pagination"
    :scroll-x="KB_PROJECT_TABLE_SCROLL_X"
    row-key="kbProjectId"
  >
    <template #bodyCell="{ column, record: row }">
      <template v-if="column.key === 'category'">
        <a-tag
          :color="KB_PROJECT_CATEGORY_COLOR[getProject(row).category]"
          class="list-table-status-tag"
        >
          {{ KB_PROJECT_CATEGORY_LABEL[getProject(row).category] }}
        </a-tag>
      </template>

      <template v-else-if="column.key === 'collectMode'">
        {{ KB_COLLECT_MODE_LABEL[getProject(row).collectMode] }}
      </template>

      <template v-else-if="column.key === 'updatedAt'">
        {{ formatKbProjectDateTime(getProject(row).updatedAt) }}
      </template>

      <template v-else-if="column.key === 'action'">
        <KbProjectActionCell
          :project="getProject(row)"
          @edit="(project) => emit('edit', project)"
          @delete="(project) => emit('delete', project)"
        />
      </template>
    </template>
  </ListTable>
</template>

<script setup lang="ts">
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue'
import type { KbProject } from '@/types/knowledge'
import ListTable from '@/components/common/ListTable.vue'
import KbProjectActionCell from '@/components/knowledge/KbProjectActionCell.vue'
import {
  KB_COLLECT_MODE_LABEL,
  KB_PROJECT_CATEGORY_COLOR,
  KB_PROJECT_CATEGORY_LABEL,
  KB_PROJECT_TABLE_SCROLL_X,
  formatKbProjectDateTime,
} from '@/utils/knowledgeDisplay'

defineProps<{
  projects: KbProject[]
  loading?: boolean
  pagination: TablePaginationConfig
}>()

const emit = defineEmits<{
  edit: [project: KbProject]
  delete: [project: KbProject]
}>()

/** a-table bodyCell 的 record 为 unknown，收窄为 KbProject */
function getProject(row: unknown): KbProject {
  return row as KbProject
}

const columns: TableColumnsType<KbProject> = [
  { title: '项目名称', key: 'projectName', dataIndex: 'projectName', width: 160, ellipsis: true },
  { title: '分类', key: 'category', width: 120 },
  { title: '采集方式', key: 'collectMode', width: 140 },
  { title: '最新版本', key: 'latestVersion', dataIndex: 'latestVersion', width: 110 },
  { title: '版本数', key: 'versionCount', dataIndex: 'versionCount', width: 90 },
  { title: '项目数', key: 'referencedProjectCount', dataIndex: 'referencedProjectCount', width: 90 },
  { title: '最近更新', key: 'updatedAt', width: 160 },
  { title: '操作', key: 'action', width: 280 },
]
</script>
