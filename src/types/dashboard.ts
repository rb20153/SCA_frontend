/** 首页顶部单个统计卡片数据（由后端 overview 接口返回） */
export interface DashboardStatItem {
  key: 'project' | 'task' | 'vulnerability' | 'autonomyRate'
  label: string
  value: number
  /** 数值后缀，如平均自主率为 `%` */
  suffix?: string
  /** 环比增量：个数或百分点，负数表示下降 */
  growth: number
  /** 增长文案单位，平均自主率传 `%` */
  growthSuffix?: string
  /** 主数值是否使用警告色（如漏洞数） */
  warnValue?: boolean
}

/** 首页概览统计 */
export interface DashboardOverview {
  stats: DashboardStatItem[]
}
