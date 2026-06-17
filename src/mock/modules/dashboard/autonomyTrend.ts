import type { ApiResponse } from '@/types/common'
import type { DashboardAutonomyTrend, DashboardAutonomyTrendPoint } from '@/types/dashboard'

const TREND_PERIOD_DAYS = 30
const TREND_END_DATE = '2026-06-17'
const TREND_START_RATE = 72
const TREND_END_RATE = 87.6

/** 格式化为 YYYY-MM-DD（本地时区，避免 toISOString 跨日偏移） */
function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 生成近 30 天平均自主率 mock 序列
 * 整体呈上升趋势，末点与 overview 统计卡 87.6% 对齐
 */
function buildAutonomyTrendPoints(): DashboardAutonomyTrendPoint[] {
  const end = new Date(`${TREND_END_DATE}T12:00:00`)
  const points: DashboardAutonomyTrendPoint[] = []

  for (let i = 0; i < TREND_PERIOD_DAYS; i += 1) {
    const date = new Date(end)
    date.setDate(end.getDate() - (TREND_PERIOD_DAYS - 1 - i))

    const progress = i / (TREND_PERIOD_DAYS - 1)
    const base = TREND_START_RATE + (TREND_END_RATE - TREND_START_RATE) * progress
    const wave = Math.sin(i * 0.65) * 1.2 + Math.cos(i * 0.35) * 0.6
    let avgRate = Math.round((base + wave) * 10) / 10
    avgRate = Math.min(100, Math.max(0, avgRate))

    points.push({
      date: formatLocalDate(date),
      avgRate,
    })
  }

  points[points.length - 1].avgRate = TREND_END_RATE
  return points
}

/** 首页近 30 天平均自主率趋势 mock */
export const mockAutonomyTrendRes: ApiResponse<DashboardAutonomyTrend> = {
  code: 200,
  message: 'ok',
  data: {
    periodDays: TREND_PERIOD_DAYS,
    points: buildAutonomyTrendPoints(),
  },
}
