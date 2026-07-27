import type { DetectTask } from '@/types/detect'
import type { ProjectDetailTabKey, Project, ProjectStatus } from '@/types/project'
import dayjs from 'dayjs'

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  in_progress: '进行中',
  completed: '已完成',
  failed: '失败',
}

export const PROJECT_STATUS_COLOR: Record<ProjectStatus, string> = {
  in_progress: 'processing',
  completed: 'success',
  failed: 'error',
}

/** 项目详情基本信息 · 状态下拉选项 */
export const PROJECT_STATUS_FORM_OPTIONS = (
  ['in_progress', 'completed', 'failed'] as const satisfies readonly ProjectStatus[]
).map((status) => ({
  value: status,
  label: PROJECT_STATUS_LABEL[status],
}))

/** 项目详情页 5 个 Tab 配置 */
export const PROJECT_DETAIL_TABS: { key: ProjectDetailTabKey; label: string }[] = [
  { key: 'basic', label: '基本信息' },
  { key: 'deliverables', label: '交付物' },
  { key: 'policy', label: '检测策略' },
  { key: 'members', label: '项目成员' },
  { key: 'tasks', label: '关联任务' },
]

/** 项目列表表格横向滚动宽度 */
export const PROJECT_TABLE_SCROLL_X = 1160

/**
 * 格式化日期时间为列表展示（YYYY-MM-DD HH:mm）
 * @param value - ISO 8601 字符串；空值返回「—」
 */
export function formatProjectDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm') : '—'
}

/**
 * 关联任务列表二次校验：剔除明显不属于当前项目的任务
 * 后端任务项常不返回 projectName，故只按 projectId 校验，缺失 projectId 时视为本项目并补齐名称
 * @param tasks - 接口返回的任务列表
 * @param project - 当前项目详情
 */
export function verifyProjectRelatedTasks(tasks: DetectTask[], project: Project): DetectTask[] {
  return tasks
    .filter((task) => !task.projectId || task.projectId === project.projectId)
    .map((task) => ({
      ...task,
      projectId: task.projectId || project.projectId,
      projectName: task.projectName || project.projectName,
    }))
}
