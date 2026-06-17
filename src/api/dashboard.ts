import type { ApiResponse } from '@/types/common'
import type {
  DashboardAutonomyTrend,
  DashboardOverview,
  DashboardVulnRiskDistribution,
} from '@/types/dashboard'
import type { DetectTask } from '@/types/detect'
import { mockAutonomyTrendRes } from '@/mock/modules/dashboard/autonomyTrend'
import { mockDashboardOverviewRes } from '@/mock/modules/dashboard/overview'
import { mockVulnerabilityDistributionRes } from '@/mock/modules/dashboard/vulnerabilityDistribution'
import { MOCK_ALL_DETECT_TASKS } from '@/mock/modules/detect/taskList'

/** 首页最近任务最大条数 */
export const RECENT_TASKS_LIMIT = 10

/**
 * 按创建时间从新到旧排序并截取前 N 条
 * 与检测任务列表共用 MOCK_ALL_DETECT_TASKS 数据源
 */
function normalizeRecentTasks(tasks: DetectTask[]): DetectTask[] {
  return [...tasks]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, RECENT_TASKS_LIMIT)
}

/** 获取首页顶部统计卡片数据 */
export function getDashboardOverview(): Promise<ApiResponse<DashboardOverview>> {
  // TODO: replace with → return request.get('/api/dashboard/overview')
  return Promise.resolve(mockDashboardOverviewRes)
}

/** 获取首页最近任务列表（最多 10 条，按时间倒序） */
export function getRecentTasks(): Promise<ApiResponse<DetectTask[]>> {
  // TODO: replace with → return request.get('/api/dashboard/recent-tasks', { params: { limit: RECENT_TASKS_LIMIT } })
  return Promise.resolve({
    code: 200,
    message: 'ok',
    data: normalizeRecentTasks(MOCK_ALL_DETECT_TASKS),
  })
}

/**
 * 获取首页近 30 天平台平均自主率趋势
 * @param days - 统计天数，默认 30
 */
export function getAutonomyTrend(
  days = 30,
): Promise<ApiResponse<DashboardAutonomyTrend>> {
  void days
  // TODO: replace with → return request.get('/api/dashboard/autonomy-trend', { params: { days } })
  return Promise.resolve(mockAutonomyTrendRes)
}

/** 获取首页漏洞风险三档分布（高危 / 中危 / 低危） */
export function getVulnerabilityDistribution(): Promise<ApiResponse<DashboardVulnRiskDistribution>> {
  // TODO: replace with → return request.get('/api/dashboard/vulnerability-distribution')
  return Promise.resolve(mockVulnerabilityDistributionRes)
}
