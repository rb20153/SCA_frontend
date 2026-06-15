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

/** 项目详情页 5 个 Tab 配置 */
export const PROJECT_DETAIL_TABS: { key: ProjectDetailTabKey; label: string }[] = [
  { key: 'basic', label: '基本信息' },
  { key: 'deliverables', label: '交付物' },
  { key: 'policy', label: '检测策略' },
  { key: 'members', label: '项目成员' },
  { key: 'tasks', label: '关联任务' },
]

/** 项目列表表格横向滚动宽度 */
export const PROJECT_TABLE_SCROLL_X = 1100

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
 * 关联任务列表二次校验：仅保留项目 ID 与项目名称均与当前项目一致的任务
 * @param tasks - 接口返回的任务列表
 * @param project - 当前项目详情
 */
export function verifyProjectRelatedTasks(tasks: DetectTask[], project: Project): DetectTask[] {
  return tasks.filter(
    (task) =>
      task.projectId === project.projectId && task.projectName === project.projectName,
  )
}
