import type { DetectTask } from '@/types/detect'

/** 检测任务列表操作项 */
export type TaskActionKey =
  | 'terminate'
  | 'edit'
  | 'viewResult'
  | 'delete'
  | 'resume'
  | 'pause'
  | 'viewLog'

export interface TaskActionItem {
  key: TaskActionKey
  label: string
}

/** 按运行状态与检测类型返回当前行可用操作（顺序即展示顺序） */
export function getTaskActions(task: DetectTask): TaskActionItem[] {
  const editAction: TaskActionItem[] =
    task.taskType === 'autonomy' ? [{ key: 'edit', label: '编辑' }] : []

  switch (task.status) {
    case 'queued':
      return [{ key: 'terminate', label: '终止' }, ...editAction]
    case 'running':
      return [{ key: 'pause', label: '暂停' }, { key: 'terminate', label: '终止' }, ...editAction]
    case 'success':
      return [
        { key: 'viewResult', label: '查看结果' },
        { key: 'delete', label: '删除' },
      ]
    case 'paused':
      return [
        { key: 'resume', label: '继续任务' },
        { key: 'delete', label: '删除' },
      ]
    case 'terminated':
      return [{ key: 'delete', label: '删除' }]
    case 'failed':
      return [
        { key: 'viewLog', label: '查看日志' },
        { key: 'delete', label: '删除' },
      ]
    default:
      return []
  }
}
