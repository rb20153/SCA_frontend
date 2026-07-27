import request from '@/utils/request'
import type { ApiResponse } from '@/types/common'
import type {
  DashboardAutonomyTrend,
  DashboardOverview,
  DashboardVulnRiskDistribution,
} from '@/types/dashboard'
import type { DetectTask } from '@/types/detect'
import {
  normalizeAutonomyTrendData,
  normalizeDashboardOverview,
  normalizeRecentDetectTasks,
  normalizeVulnDistributionData,
} from '@/utils/dashboardAdapter'

/** 首页最近任务最大条数 */
export const RECENT_TASKS_LIMIT = 10

/** 获取首页顶部统计卡片数据 */
export async function getDashboardOverview(): Promise<ApiResponse<DashboardOverview>> {
  const res = await request.get<ApiResponse<unknown>>('/api/dashboard/overview')
  return { ...res, data: normalizeDashboardOverview(res.data) }
}

/** 获取首页最近任务列表（最多 limit 条，按时间倒序） */
export async function getRecentTasks(
  limit = RECENT_TASKS_LIMIT,
): Promise<ApiResponse<DetectTask[]>> {
  const res = await request.get<ApiResponse<unknown>>('/api/dashboard/recent-tasks', {
    params: { limit },
  })
  return { ...res, data: normalizeRecentDetectTasks(res.data) }
}

/**
 * 获取首页近 30 天平台平均自主率趋势
 * @param days - 统计天数，默认 30
 */
export async function getAutonomyTrend(
  days = 30,
): Promise<ApiResponse<DashboardAutonomyTrend>> {
  const res = await request.get<ApiResponse<{ periodDays?: number; points?: unknown }>>(
    '/api/dashboard/autonomy-trend',
    { params: { days } },
  )
  return { ...res, data: normalizeAutonomyTrendData(res.data) }
}

/** 获取首页漏洞风险三档分布（高危 / 中危 / 低危） */
export async function getVulnerabilityDistribution(): Promise<
  ApiResponse<DashboardVulnRiskDistribution>
> {
  const res = await request.get<ApiResponse<{ total?: number; items?: unknown }>>(
    '/api/dashboard/vulnerability-distribution',
  )
  return { ...res, data: normalizeVulnDistributionData(res.data) }
}
