/** 首页顶部单个统计卡片数据（由后端 overview 接口返回） */
export interface DashboardStatItem {
  key: 'project' | 'task' | 'vulnerability' | 'autonomyRate'
  label: string
  value: number
  /** 数值后缀，如平均自主率为 `%` */
  suffix?: string
  /** 环比增量：个数或百分点，负数表示下降；后端未返回时不展示增长率行 */
  growth?: number
  /** 增长文案单位，平均自主率传 `%` */
  growthSuffix?: string
  /** 主数值是否使用警告色（如漏洞数） */
  warnValue?: boolean
}

/** 首页概览统计 */
export interface DashboardOverview {
  stats: DashboardStatItem[]
}

/** 首页漏洞风险分布等级（三档，与开源风险任务口径一致） */
export type DashboardVulnRiskLevel = 'high' | 'medium' | 'low'

/** 近 N 日自主率趋势单点 */
export interface DashboardAutonomyTrendPoint {
  /** 日期，ISO 8601 日期部分 YYYY-MM-DD */
  date: string
  /** 平台平均自主率，0–100 */
  avgRate: number
}

/** 首页自主率趋势（默认近 30 天） */
export interface DashboardAutonomyTrend {
  periodDays: number
  points: DashboardAutonomyTrendPoint[]
}

/** 漏洞风险分布单项 */
export interface DashboardVulnRiskDistributionItem {
  level: DashboardVulnRiskLevel
  count: number
}

/** 首页漏洞风险等级分布 */
export interface DashboardVulnRiskDistribution {
  total: number
  items: DashboardVulnRiskDistributionItem[]
}
