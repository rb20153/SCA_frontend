import type {
  DashboardAutonomyTrend,
  DashboardAutonomyTrendPoint,
  DashboardOverview,
  DashboardStatItem,
  DashboardVulnRiskDistribution,
  DashboardVulnRiskDistributionItem,
  DashboardVulnRiskLevel,
} from '@/types/dashboard'
import type { DetectTask } from '@/types/detect'
import { normalizeDetectTask } from '@/utils/detectAdapter'

/** 解析漏洞风险档位（兼容 HIGH / high 等） */
function normalizeVulnLevel(raw: unknown): DashboardVulnRiskLevel | null {
  const text = String(raw ?? '').toLowerCase()
  if (text === 'high' || text.includes('高')) return 'high'
  if (text === 'medium' || text.includes('中')) return 'medium'
  if (text === 'low' || text.includes('低')) return 'low'
  return null
}

/** 将后端趋势点规范为 { date, avgRate } */
function normalizeTrendPoint(raw: Record<string, unknown>): DashboardAutonomyTrendPoint | null {
  const avgRate = Number(raw.avgRate ?? raw.overallRate ?? raw.netRate ?? raw.riskRate)
  if (Number.isNaN(avgRate)) return null

  let date = String(raw.date ?? '').trim()
  if (!date) {
    date = new Date().toISOString().slice(0, 10)
  }

  return { date, avgRate }
}

/**
 * 规范自主率趋势 points
 * 后端可能返回数组，或单个汇总对象（含 overallRate 等）
 */
export function normalizeAutonomyTrendData(raw: {
  periodDays?: number
  points?: unknown
}): DashboardAutonomyTrend {
  const periodDays = Number(raw.periodDays ?? 30)
  const pointsRaw = raw.points

  let points: DashboardAutonomyTrendPoint[] = []
  if (Array.isArray(pointsRaw)) {
    points = pointsRaw
      .map((item) => normalizeTrendPoint(item as Record<string, unknown>))
      .filter((p): p is DashboardAutonomyTrendPoint => p !== null)
  } else if (pointsRaw && typeof pointsRaw === 'object') {
    const single = normalizeTrendPoint(pointsRaw as Record<string, unknown>)
    if (single) points = [single]
  }

  return { periodDays, points }
}

/**
 * 规范漏洞风险分布
 * 后端 items 可能是数组或单对象；level 可能是 HIGH；count 可能在 value 字段
 */
export function normalizeVulnDistributionData(raw: {
  total?: number
  items?: unknown
}): DashboardVulnRiskDistribution {
  const list: Record<string, unknown>[] = Array.isArray(raw.items)
    ? (raw.items as Record<string, unknown>[])
    : raw.items && typeof raw.items === 'object'
      ? [raw.items as Record<string, unknown>]
      : []

  const countByLevel = new Map<DashboardVulnRiskLevel, number>()
  for (const item of list) {
    const level = normalizeVulnLevel(item.level ?? item.name)
    if (!level) continue
    const count = Number(item.count ?? item.value ?? 0)
    countByLevel.set(level, (countByLevel.get(level) ?? 0) + (Number.isNaN(count) ? 0 : count))
  }

  const items: DashboardVulnRiskDistributionItem[] = (
    ['high', 'medium', 'low'] as const
  ).map((level) => ({
    level,
    count: countByLevel.get(level) ?? 0,
  }))

  const total =
    typeof raw.total === 'number' && raw.total >= 0
      ? raw.total
      : items.reduce((sum, item) => sum + item.count, 0)

  return { total, items }
}

/** 规范 recent-tasks 列表（任务字段映射复用 detectAdapter） */
export function normalizeRecentDetectTasks(raw: unknown): DetectTask[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => normalizeDetectTask(item as Record<string, unknown>))
}

/** 规范 overview.stats（兼容 stats 为数组或对象 map） */
export function normalizeDashboardOverview(raw: { stats?: unknown }): DashboardOverview {
  const statsRaw = raw.stats
  if (Array.isArray(statsRaw)) {
    return { stats: statsRaw as DashboardStatItem[] }
  }
  if (statsRaw && typeof statsRaw === 'object') {
    const obj = statsRaw as Record<string, unknown>
    if ('key' in obj) {
      return { stats: [obj as unknown as DashboardStatItem] }
    }
  }
  return { stats: [] }
}
