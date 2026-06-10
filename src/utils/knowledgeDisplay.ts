import type { KbCollectMode, KbProjectCategory } from '@/types/knowledge'
import dayjs from 'dayjs'

export const KB_PROJECT_CATEGORY_LABEL: Record<KbProjectCategory, string> = {
  simulation_framework: '仿真框架',
  numerical_computing: '数值计算',
  toolchain: '工具链',
}

export const KB_PROJECT_CATEGORY_COLOR: Record<KbProjectCategory, string> = {
  simulation_framework: 'cyan',
  numerical_computing: 'blue',
  toolchain: 'default',
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
