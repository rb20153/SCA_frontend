import type { TaskStatus, TaskType } from '@/types/common'
import type { TaskListFilters, TaskQueryParams } from '@/types/detect'
import { TASK_TYPE_LABEL } from '@/utils/taskDisplay'

/** 检测类型筛选项 */
export const TASK_TYPE_FILTER_OPTIONS: { value: TaskType | ''; label: string }[] = [
  { value: '', label: '全部类型' },
  { value: 'autonomy', label: TASK_TYPE_LABEL.autonomy },
  { value: 'open-source-risk', label: TASK_TYPE_LABEL['open-source-risk'] },
]

/** 运行状态筛选项 */
export const TASK_STATUS_FILTER_OPTIONS: { value: TaskStatus | ''; label: string }[] = [
  { value: '', label: '全部状态' },
  { value: 'queued', label: '排队中' },
  { value: 'running', label: '运行中' },
  { value: 'success', label: '已完成' },
  { value: 'paused', label: '已暂停' },
  { value: 'terminated', label: '已终止' },
  { value: 'failed', label: '失败' },
]

export function createEmptyTaskListFilters(): TaskListFilters {
  return {
    taskName: '',
    taskType: '',
    projectName: '',
    status: '',
  }
}

/** 将表单筛选条件转为 API 查询参数（空值不传） */
export function taskListFiltersToQuery(
  filters: TaskListFilters,
): Omit<TaskQueryParams, 'page' | 'pageSize'> {
  const query: Omit<TaskQueryParams, 'page' | 'pageSize'> = {}
  const taskName = filters.taskName.trim()
  const projectName = filters.projectName.trim()

  if (taskName) query.taskName = taskName
  if (filters.taskType) query.taskType = filters.taskType
  if (projectName) query.projectName = projectName
  if (filters.status) query.status = filters.status

  return query
}
