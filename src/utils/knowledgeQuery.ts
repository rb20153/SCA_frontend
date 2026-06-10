import type {
  KbCollectMode,
  KbProjectCategory,
  KbProjectListFilters,
  KbProjectQueryParams,
} from '@/types/knowledge'
import {
  KB_COLLECT_MODE_LABEL,
  KB_PROJECT_CATEGORY_LABEL,
} from '@/utils/knowledgeDisplay'

/** 分类筛选项（默认「全部分类」） */
export const KB_PROJECT_CATEGORY_FILTER_OPTIONS: {
  value: KbProjectCategory | ''
  label: string
}[] = [
  { value: '', label: '全部分类' },
  { value: 'simulation_framework', label: KB_PROJECT_CATEGORY_LABEL.simulation_framework },
  { value: 'numerical_computing', label: KB_PROJECT_CATEGORY_LABEL.numerical_computing },
  { value: 'toolchain', label: KB_PROJECT_CATEGORY_LABEL.toolchain },
]

/** 采集方式筛选项（默认「全部方式」） */
export const KB_COLLECT_MODE_FILTER_OPTIONS: {
  value: KbCollectMode | ''
  label: string
}[] = [
  { value: '', label: '全部方式' },
  { value: 'cloud_repo', label: KB_COLLECT_MODE_LABEL.cloud_repo },
  { value: 'upload_package', label: KB_COLLECT_MODE_LABEL.upload_package },
]

/** 编辑弹窗分类选项 */
export const KB_PROJECT_CATEGORY_OPTIONS = KB_PROJECT_CATEGORY_FILTER_OPTIONS.filter(
  (item) => item.value !== '',
)

/** 编辑弹窗采集方式选项 */
export const KB_COLLECT_MODE_OPTIONS = KB_COLLECT_MODE_FILTER_OPTIONS.filter(
  (item) => item.value !== '',
)

/** 返回空的知识库项目列表筛选表单 */
export function createEmptyKbProjectListFilters(): KbProjectListFilters {
  return {
    projectName: '',
    category: '',
    collectMode: '',
    updatedDate: undefined,
  }
}

/** 将表单筛选条件转为 API 查询参数（空值不传） */
export function kbProjectListFiltersToQuery(
  filters: KbProjectListFilters,
): Omit<KbProjectQueryParams, 'page' | 'pageSize'> {
  const query: Omit<KbProjectQueryParams, 'page' | 'pageSize'> = {}
  const projectName = filters.projectName.trim()

  if (projectName) query.projectName = projectName
  if (filters.category) query.category = filters.category
  if (filters.collectMode) query.collectMode = filters.collectMode
  if (filters.updatedDate) {
    query.updatedDate = filters.updatedDate.format('YYYY-MM-DD')
  }

  return query
}
