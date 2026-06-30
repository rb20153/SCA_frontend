import type { KbCollectMode, KbIntakeTodoStatus, KbProjectCategory } from '@/types/knowledge'
import dayjs from 'dayjs'

export const KB_PROJECT_CATEGORY_LABEL: Record<KbProjectCategory, string> = {
  simulation_framework: '仿真框架',
  numerical_computing: '数值计算',
  pre_post_processing: '前后处理',
  general_dependency: '通用依赖',
}

export const KB_PROJECT_CATEGORY_COLOR: Record<KbProjectCategory, string> = {
  simulation_framework: 'cyan',
  numerical_computing: 'blue',
  pre_post_processing: 'purple',
  general_dependency: 'default',
}

/** 分类扇形图展示顺序 */
export const KB_PROJECT_CATEGORY_ORDER: KbProjectCategory[] = [
  'simulation_framework',
  'numerical_computing',
  'pre_post_processing',
  'general_dependency',
]

/** 分类扇形图 ECharts 色值（低饱和，与漏洞风险图等保持一致） */
export const KB_PROJECT_CATEGORY_PIE_COLOR: Record<KbProjectCategory, string> = {
  simulation_framework: '#7ecbd4',
  numerical_computing: '#8fb0e8',
  pre_post_processing: '#b8a8d8',
  general_dependency: '#b5bcc6',
}

export const KB_INTAKE_TODO_STATUS_LABEL: Record<KbIntakeTodoStatus, string> = {
  in_progress: '进行中',
  pending: '待处理',
  alert: '告警',
}

export const KB_INTAKE_TODO_STATUS_COLOR: Record<KbIntakeTodoStatus, string> = {
  in_progress: 'processing',
  pending: 'default',
  alert: 'error',
}

export const KB_COLLECT_MODE_LABEL: Record<KbCollectMode, string> = {
  cloud_repo: '云端仓库拉取',
  upload_package: '上传源码包',
}

/** 知识库项目列表表格横向滚动宽度 */
export const KB_PROJECT_TABLE_SCROLL_X = 1200

/**
 * 格式化最近更新时间为列表展示
 * @param value - ISO 8601 字符串
 */
export function formatKbProjectDateTime(value: string): string {
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm') : '—'
}
