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

interface OverviewStatDef {
  key: DashboardStatItem['key']
  label: string
  /** 计数可能出现的字段名，按顺序取第一个能转成数字的 */
  valueKeys: readonly string[]
  /** 环比增量可能出现的字段名 */
  growthKeys: readonly string[]
  /** 数值后缀，同时作为增长文案单位 */
  suffix?: string
  /** 值大于 0 时主数值用警告色 */
  warnWhenPositive?: boolean
}

/** 首页 4 张卡片口径；后端只给平铺计数时按这里拼卡片 */
const OVERVIEW_STAT_DEFS: readonly OverviewStatDef[] = [
  {
    key: 'project',
    label: '项目数',
    valueKeys: ['projectCount', 'projectTotal'],
    growthKeys: ['projectGrowth', 'projectCountGrowth'],
  },
  {
    key: 'task',
    label: '任务数',
    valueKeys: ['taskCount', 'taskTotal'],
    growthKeys: ['taskGrowth', 'taskCountGrowth'],
  },
  {
    key: 'vulnerability',
    label: '漏洞数',
    valueKeys: ['vulnerabilityCount', 'vulnCount'],
    growthKeys: ['vulnerabilityGrowth', 'vulnCountGrowth'],
    warnWhenPositive: true,
  },
  {
    key: 'autonomyRate',
    label: '平均自主率',
    valueKeys: ['averageAutonomyRate', 'avgAutonomyRate', 'autonomyRate'],
    growthKeys: ['autonomyRateGrowth', 'averageAutonomyRateGrowth'],
    suffix: '%',
  },
]

/** 转数字，空串/null/非数字一律返回 null，避免被当成 0 展示 */
function toNumber(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === '') return null
  const num = Number(raw)
  // 保留两位小数，规避 99.61000000000001 这类浮点噪声
  return Number.isFinite(num) ? Math.round(num * 100) / 100 : null
}

/** 在多个候选对象里按 keys 顺序找第一个数字 */
function pickNumber(
  sources: readonly Record<string, unknown>[],
  keys: readonly string[],
): number | null {
  for (const source of sources) {
    for (const key of keys) {
      const num = toNumber(source[key])
      if (num !== null) return num
    }
  }
  return null
}

/** 规范后端已按约定返回的单张卡片；缺 key 或数值不合法则丢弃 */
function normalizeStatItem(raw: Record<string, unknown>): DashboardStatItem | null {
  const def = OVERVIEW_STAT_DEFS.find((item) => item.key === raw.key)
  if (!def) return null

  const value = pickNumber([raw], ['value', 'count'])
  if (value === null) return null

  const growth = pickNumber([raw], ['growth'])
  const suffix = String(raw.suffix ?? def.suffix ?? '') || undefined

  return {
    key: def.key,
    label: String(raw.label ?? def.label),
    value,
    ...(suffix ? { suffix } : {}),
    ...(growth !== null ? { growth, ...(suffix ? { growthSuffix: suffix } : {}) } : {}),
    ...(raw.warnValue === true || (def.warnWhenPositive && value > 0) ? { warnValue: true } : {}),
  }
}

/** 从平铺计数里拼单张卡片；找不到数值返回 null */
function buildStatFromCounts(
  def: OverviewStatDef,
  data: Record<string, unknown>,
  statsObj: Record<string, unknown>,
): DashboardStatItem | null {
  // 优先取 stats 里按卡片 key 分组的子对象，其次取 stats 平级字段，最后取 data 平级字段
  const nested =
    statsObj[def.key] && typeof statsObj[def.key] === 'object'
      ? (statsObj[def.key] as Record<string, unknown>)
      : null

  const value =
    (nested ? pickNumber([nested], ['value', 'count', ...def.valueKeys]) : null) ??
    pickNumber([statsObj, data], def.valueKeys)
  if (value === null) return null

  const growth =
    (nested ? pickNumber([nested], ['growth', ...def.growthKeys]) : null) ??
    pickNumber([statsObj, data], def.growthKeys)

  return {
    key: def.key,
    label: def.label,
    value,
    ...(def.suffix ? { suffix: def.suffix } : {}),
    ...(growth !== null ? { growth, ...(def.suffix ? { growthSuffix: def.suffix } : {}) } : {}),
    ...(def.warnWhenPositive && value > 0 ? { warnValue: true } : {}),
  }
}

/** 收集后端按约定返回的卡片（stats 为数组或单个卡片对象），按 key 建索引 */
function collectDeclaredStats(statsRaw: unknown): Map<DashboardStatItem['key'], DashboardStatItem> {
  const declared = new Map<DashboardStatItem['key'], DashboardStatItem>()

  const list = Array.isArray(statsRaw)
    ? statsRaw
    : statsRaw && typeof statsRaw === 'object' && 'key' in (statsRaw as Record<string, unknown>)
      ? [statsRaw]
      : []

  for (const item of list) {
    const stat = normalizeStatItem((item ?? {}) as Record<string, unknown>)
    if (stat) declared.set(stat.key, stat)
  }
  return declared
}

/**
 * 规范首页概览统计
 * 兼容并且**合并**两种后端形态：
 * 1. 约定形态——`data.stats` 是卡片数组，或只有一张卡片的对象
 * 2. 实际形态——计数平铺在 `data` 上（projectCount / taskCount / vulnerabilityCount /
 *    averageAutonomyRate）
 * 后端只给了其中一张卡片时，剩下三张仍从平铺计数补齐，避免整行只剩一张卡。
 * 没给环比增量则不返回 growth，卡片自动隐藏增长率行
 */
export function normalizeDashboardOverview(raw: unknown): DashboardOverview {
  const data = (raw ?? {}) as Record<string, unknown>
  const statsRaw = data.stats
  const statsObj =
    statsRaw && typeof statsRaw === 'object' && !Array.isArray(statsRaw)
      ? (statsRaw as Record<string, unknown>)
      : {}

  const declared = collectDeclaredStats(statsRaw)

  const stats: DashboardStatItem[] = []
  for (const def of OVERVIEW_STAT_DEFS) {
    const stat = declared.get(def.key) ?? buildStatFromCounts(def, data, statsObj)
    if (stat) stats.push(stat)
  }

  return { stats }
}
