/**
 * 自主率配色阈值工具
 *
 * 统一约束自主率（0–100）在全站的等级与配色，避免阈值散落在各组件中：
 * - 低（< 50）：红色，自主率不足，需重点关注
 * - 中（50 ≤ rate < 80）：黄色，有一定风险
 * - 高（≥ 80）：绿色，自主率良好
 *
 * 颜色取自 Ant Design Vue 主题语义色（error / warning / success）。
 */

/** 自主率等级 */
export type AutonomyRateLevel = 'low' | 'medium' | 'high'

/** 各等级对应配色（与 ant-design-vue 语义色一致） */
export const AUTONOMY_RATE_COLOR: Record<AutonomyRateLevel, string> = {
  low: '#ff4d4f',
  medium: '#faad14',
  high: '#52c41a',
}

/**
 * 按自主率数值判定等级
 * @param rate - 自主率，0–100
 * @returns 'low' | 'medium' | 'high'
 */
export function getAutonomyRateLevel(rate: number): AutonomyRateLevel {
  if (rate < 50) return 'low'
  if (rate < 80) return 'medium'
  return 'high'
}

/**
 * 按自主率数值取对应配色
 * @param rate - 自主率，0–100
 * @returns 十六进制颜色字符串
 */
export function getAutonomyRateColor(rate: number): string {
  return AUTONOMY_RATE_COLOR[getAutonomyRateLevel(rate)]
}
