import type { ProjectListFilters, ProjectQueryParams, ProjectStatus } from '@/types/project'
import { PROJECT_STATUS_LABEL } from '@/utils/projectDisplay'

/** 项目状态筛选项 */
export const PROJECT_STATUS_FILTER_OPTIONS: { value: ProjectStatus | ''; label: string }[] = [
  { value: '', label: '全部状态' },
  { value: 'in_progress', label: PROJECT_STATUS_LABEL.in_progress },
  { value: 'completed', label: PROJECT_STATUS_LABEL.completed },
  { value: 'failed', label: PROJECT_STATUS_LABEL.failed },
]

/** 返回空的项目列表筛选表单 */
export function createEmptyProjectListFilters(): ProjectListFilters {
  return {
    projectName: '',
    owner: '',
    status: '',
    createdAtRange: undefined,
  }
}

/** 将表单筛选条件转为 API 查询参数（空值不传） */
export function projectListFiltersToQuery(
  filters: ProjectListFilters,
): Omit<ProjectQueryParams, 'page' | 'pageSize'> {
  const query: Omit<ProjectQueryParams, 'page' | 'pageSize'> = {}
  const projectName = filters.projectName.trim()
  const owner = filters.owner.trim()

  if (projectName) query.projectName = projectName
  if (owner) query.owner = owner
  if (filters.status) query.status = filters.status

  if (filters.createdAtRange) {
    query.createdAtStart = filters.createdAtRange[0].format('YYYY-MM-DD HH:mm:ss')
    query.createdAtEnd = filters.createdAtRange[1].format('YYYY-MM-DD HH:mm:ss')
  }

  return query
}
