<template>
  <ListTable
    :columns="columns"
    :data-source="projects"
    :loading="loading"
    :pagination="pagination"
    :scroll-x="PROJECT_TABLE_SCROLL_X"
    row-key="projectId"
  >
    <template #bodyCell="{ column, record: row, text }">
      <template v-if="column.key === 'status'">
        <a-tag :color="PROJECT_STATUS_COLOR[getProject(row).status]" class="list-table-status-tag">
          {{ PROJECT_STATUS_LABEL[getProject(row).status] }}
        </a-tag>
      </template>

      <template v-else-if="column.key === 'lastScanAt'">
        {{ formatProjectDateTime(getProject(row).lastScanAt) }}
      </template>

      <template v-else-if="column.key === 'createdAt'">
        {{ formatProjectDateTime(getProject(row).createdAt) }}
      </template>

      <template v-else-if="column.key === 'action'">
        <ProjectActionCell
          :project="getProject(row)"
          @edit="(project) => emit('edit', project)"
          @delete="(project) => emit('delete', project)"
        />
      </template>

      <ListTableCell v-else :column="column" :text="text" />
    </template>
  </ListTable>
</template>

<script setup lang="ts">
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue'
import type { Project } from '@/types/project'
import ListTable from '@/components/common/ListTable.vue'
import ListTableCell from '@/components/common/ListTableCell.vue'
import ProjectActionCell from '@/components/project/ProjectActionCell.vue'
import {
  PROJECT_STATUS_COLOR,
  PROJECT_STATUS_LABEL,
  PROJECT_TABLE_SCROLL_X,
  formatProjectDateTime,
} from '@/utils/projectDisplay'

defineProps<{
  projects: Project[]
  loading?: boolean
  pagination: TablePaginationConfig
}>()

const emit = defineEmits<{
  edit: [project: Project]
  delete: [project: Project]
}>()

/** a-table bodyCell 的 record 为 unknown，收窄为 Project */
function getProject(row: unknown): Project {
  return row as Project
}

const columns: TableColumnsType<Project> = [
  { title: '项目名称', key: 'projectName', dataIndex: 'projectName', width: 180, ellipsis: true },
  { title: '负责人', key: 'owner', dataIndex: 'owner', width: 120, ellipsis: true },
  { title: '状态', key: 'status', width: 110 },
  { title: '关联任务数', key: 'taskCount', dataIndex: 'taskCount', width: 120 },
  { title: '最近扫描时间', key: 'lastScanAt', width: 170 },
  { title: '创建时间', key: 'createdAt', width: 170 },
  { title: '操作', key: 'action', width: 180 },
]
</script>
