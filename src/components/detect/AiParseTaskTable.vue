<template>
  <ListTable
    :columns="columns"
    :data-source="tasks"
    :loading="loading"
    :pagination="pagination"
    :scroll-x="AI_PARSE_TASK_TABLE_SCROLL_X"
    row-key="parseTaskId"
  >
    <template #bodyCell="{ column, record: row, text }">
      <template v-if="column.key === 'createdAt'">
        {{ formatProjectDateTime(getTask(row).createdAt) }}
      </template>

      <template v-else-if="column.key === 'sourceMode'">
        {{ AI_PARSE_SOURCE_LABEL[getTask(row).sourceMode] }}
      </template>

      <template v-else-if="column.key === 'status'">
        <a-tag
          :color="AI_PARSE_STATUS_COLOR[getTask(row).status]"
          class="list-table-status-tag"
        >
          {{ AI_PARSE_STATUS_LABEL[getTask(row).status] }}
        </a-tag>
      </template>

      <template v-else-if="column.key === 'scanDepth'">
        {{ formatAiParseScanDepth(getTask(row).scanDepth) }}
      </template>

      <template v-else-if="column.key === 'resultSummary'">
        {{ formatOptionalSummary(getTask(row)) }}
      </template>

      <template v-else-if="column.key === 'confidence'">
        {{ formatConfidence(getTask(row)) }}
      </template>

      <template v-else-if="column.key === 'elapsedMs'">
        {{ formatDurationMs(getTask(row).elapsedMs) }}
      </template>

      <template v-else-if="column.key === 'conflictCount'">
        {{ formatOptionalConflictCount(getTask(row)) }}
      </template>

      <template v-else-if="column.key === 'action'">
        <span class="action-cell">
          <a
            v-if="getTask(row).status === 'success'"
            href="#"
            class="list-table-link"
            @click.prevent="emit('view-result', getTask(row))"
          >
            查看结果
          </a>
          <a
            v-else-if="getTask(row).status === 'failed'"
            href="#"
            class="list-table-link"
            @click.prevent="emit('fallback', getTask(row))"
          >
            规则回退对比
          </a>
          <span v-else class="list-table-action-dash">—</span>
        </span>
      </template>

      <ListTableCell v-else :column="column" :text="text" />
    </template>
  </ListTable>
</template>

<script setup lang="ts">
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue'
import ListTable from '@/components/common/ListTable.vue'
import ListTableCell from '@/components/common/ListTableCell.vue'
import type { AiParseTask } from '@/types/detect'
import { formatProjectDateTime } from '@/utils/projectDisplay'
import {
  AI_PARSE_SOURCE_LABEL,
  AI_PARSE_STATUS_COLOR,
  AI_PARSE_STATUS_LABEL,
  AI_PARSE_TASK_TABLE_SCROLL_X,
  formatAiParseScanDepth,
} from '@/utils/aiParseQuery'
import { formatDurationMs } from '@/utils/taskDisplay'

defineProps<{
  tasks: AiParseTask[]
  loading?: boolean
  pagination: TablePaginationConfig
}>()

const emit = defineEmits<{
  'view-result': [task: AiParseTask]
  fallback: [task: AiParseTask]
}>()

/** a-table bodyCell 的 record 收窄为 AiParseTask */
function getTask(row: unknown): AiParseTask {
  return row as AiParseTask
}

/** 进行中/失败时结果摘要显示 — */
function formatOptionalSummary(task: AiParseTask): string {
  return task.status === 'success' && task.resultSummary ? task.resultSummary : '—'
}

/** 进行中/失败时冲突数显示 — */
function formatOptionalConflictCount(task: AiParseTask): string {
  return task.status === 'success' && task.conflictCount !== null
    ? String(task.conflictCount)
    : '—'
}

function formatConfidence(task: AiParseTask): string {
  if (task.status !== 'success' || task.confidence <= 0) return '—'
  return `${(task.confidence * 100).toFixed(1)}%`
}

const columns: TableColumnsType<AiParseTask> = [
  {
    title: '解析对象',
    key: 'parseObjectName',
    dataIndex: 'parseObjectName',
    width: 180,
    ellipsis: true,
  },
  {
    title: '关联项目',
    key: 'projectName',
    dataIndex: 'projectName',
    width: 140,
    ellipsis: true,
  },
  {
    title: '时间',
    key: 'createdAt',
    width: 168,
  },
  {
    title: '来源',
    key: 'sourceMode',
    width: 128,
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
  },
  {
    title: '扫描深度',
    key: 'scanDepth',
    width: 108,
  },
  {
    title: '结果摘要',
    key: 'resultSummary',
    width: 140,
    ellipsis: true,
  },
  { title: '置信度', key: 'confidence', width: 96 },
  { title: '耗时', key: 'elapsedMs', width: 112 },
  {
    title: '冲突数',
    key: 'conflictCount',
    width: 88,
  },
  {
    title: '操作',
    key: 'action',
    width: 128,
  },
]
</script>

<style scoped>
.action-cell {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
}
</style>
