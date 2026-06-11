<template>
  <ListTable
    :columns="columns"
    :data-source="tasks"
    :loading="loading"
    :pagination="pagination"
    :scroll-x="tableScrollX"
    row-key="taskId"
  >
    <template #bodyCell="{ column, record: row, text }">
      <template v-if="column.key === 'taskType'">
        <TaskTypeText :task-type="getTask(row).taskType" />
      </template>

      <template v-else-if="column.key === 'sourceMode'">
        <EllipsisText :text="TASK_SOURCE_MODE_LABEL[getTask(row).sourceMode]" />
      </template>

      <template v-else-if="column.key === 'status'">
        <a-tag :color="TASK_STATUS_COLOR[getTask(row).status]" class="list-table-status-tag">
          {{ TASK_STATUS_LABEL[getTask(row).status] }}
        </a-tag>
      </template>

      <template v-else-if="column.key === 'progress'">
        <a-progress
          :percent="getTaskDisplayProgress(getTask(row))"
          :show-info="true"
          size="small"
          class="progress-cell"
          :status="getTaskProgressStatus(getTask(row).status)"
        />
      </template>

      <template v-else-if="column.key === 'elapsed'">
        {{ formatDurationMs(getTask(row).elapsedMs) }}
      </template>

      <template v-else-if="column.key === 'action'">
        <DetectTaskActionCell
          v-if="showFullActions"
          :task="getTask(row)"
          @task-updated="(task) => emit('task-updated', task)"
          @task-deleted="(taskId) => emit('task-deleted', taskId)"
        />
        <template v-else>
          <router-link
            v-if="getTask(row).status === 'success'"
            :to="getTaskResultRoute(getTask(row))"
            class="list-table-link"
          >
            查看结果
          </router-link>
          <router-link
            v-else-if="getTask(row).status === 'failed'"
            :to="getTaskLogListRoute(getTask(row))"
            class="list-table-link"
          >
            查看日志
          </router-link>
          <span v-else class="list-table-action-dash">—</span>
        </template>
      </template>

      <ListTableCell v-else :column="column" :text="text" />
    </template>
  </ListTable>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue'
import { TASK_STATUS_COLOR, TASK_STATUS_LABEL } from '@/types/common'
import type { DetectTask } from '@/types/detect'
import EllipsisText from '@/components/common/EllipsisText.vue'
import ListTable from '@/components/common/ListTable.vue'
import ListTableCell from '@/components/common/ListTableCell.vue'
import DetectTaskActionCell from '@/components/detect/DetectTaskActionCell.vue'
import TaskTypeText from '@/components/detect/TaskTypeText.vue'
import {
  DETECT_TASK_LIST_SCROLL_X,
  DETECT_TASK_TABLE_SCROLL_X,
  TASK_SOURCE_MODE_LABEL,
  formatDurationMs,
  getTaskDisplayProgress,
  getTaskLogListRoute,
  getTaskProgressStatus,
  getTaskResultRoute,
} from '@/utils/taskDisplay'

const props = withDefaults(
  defineProps<{
    tasks: DetectTask[]
    loading?: boolean
    /** 首页最近任务传 false；检测任务列表页传分页配置 */
    pagination?: TablePaginationConfig | false
    /** 检测任务列表页展示「来源/模式」列；首页不展示 */
    showSourceMode?: boolean
    /** 检测任务列表页展示完整操作列（含弹窗交互） */
    showFullActions?: boolean
  }>(),
  {
    loading: false,
    pagination: false,
    showSourceMode: false,
    showFullActions: false,
  },
)

const emit = defineEmits<{
  'task-updated': [task: DetectTask]
  'task-deleted': [taskId: string]
}>()

/** a-table bodyCell 的 record 为 unknown，收窄为 DetectTask */
function getTask(row: unknown): DetectTask {
  return row as DetectTask
}

const actionColumnWidth = computed(() => (props.showFullActions ? 220 : 110))

const columns = computed<TableColumnsType<DetectTask>>(() => {
  const cols: TableColumnsType<DetectTask> = [
    { title: '任务名称', dataIndex: 'taskName', key: 'taskName', width: 180, ellipsis: true },
    { title: '检测类型', key: 'taskType', width: 130 },
    { title: '项目', dataIndex: 'projectName', key: 'projectName', width: 160, ellipsis: true },
  ]

  if (props.showSourceMode) {
    cols.push({ title: '来源/模式', key: 'sourceMode', width: 120 })
  }

  cols.push(
    { title: '运行状态', key: 'status', width: 120 },
    { title: '进度', key: 'progress', width: 140 },
    { title: '耗时', key: 'elapsed', width: 100 },
    { title: '操作', key: 'action', width: actionColumnWidth.value },
  )

  return cols
})

const tableScrollX = computed(() => {
  if (props.showSourceMode && props.showFullActions) {
    return DETECT_TASK_LIST_SCROLL_X
  }
  if (props.showSourceMode) {
    return DETECT_TASK_LIST_SCROLL_X - 110 + actionColumnWidth.value
  }
  return DETECT_TASK_TABLE_SCROLL_X
})
</script>

<style scoped>
.progress-cell {
  width: 120px;
  margin: 0 auto;
}
</style>
