import type { CoverageGapImpact } from '@/types/knowledge'

/** 待补全影响程度文案 */
export const COVERAGE_GAP_IMPACT_LABEL: Record<CoverageGapImpact, string> = {
  low: '低',
  medium: '中',
  high: '高',
}

/** 待补全影响程度 Tag 颜色 */
export const COVERAGE_GAP_IMPACT_COLOR: Record<CoverageGapImpact, string> = {
  low: 'success',
  medium: 'warning',
  high: 'error',
}

/**
 * 覆盖率数值格式化为百分比展示
 * @param value - 0–100 的数值
 */
export function formatCoveragePercent(value: number): string {
  return `${value}%`
}

/**
 * 平均耗时格式化为中文展示
 * @param minutes - 分钟数
 */
export function formatCoverageDuration(minutes: number): string {
  return `${minutes} 分钟`
}
