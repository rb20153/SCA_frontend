import type { ProjectMemberRole } from '@/types/project'
import dayjs from 'dayjs'

export const PROJECT_MEMBER_ROLE_LABEL: Record<ProjectMemberRole, string> = {
  owner: '负责人',
  member: '成员',
}

export const PROJECT_MEMBER_ROLE_COLOR: Record<ProjectMemberRole, string> = {
  owner: 'blue',
  member: 'default',
}

/** 项目成员表格横向滚动宽度 */
export const PROJECT_MEMBER_TABLE_SCROLL_X = 980

/**
 * 格式化加入项目时间为列表展示（YYYY-MM-DD HH:mm）
 * @param value - ISO 8601 字符串
 */
export function formatProjectMemberJoinedAt(value: string): string {
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm') : '—'
}
