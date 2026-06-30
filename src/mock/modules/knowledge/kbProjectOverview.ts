import type { ApiResponse } from '@/types/common'
import type { KbProjectCategory, KbProjectOverview } from '@/types/knowledge'
import { MOCK_ALL_KB_PROJECTS } from '@/mock/modules/knowledge/knowledgeList'

const KB_CATEGORY_KEYS: KbProjectCategory[] = [
  'simulation_framework',
  'numerical_computing',
  'pre_post_processing',
  'general_dependency',
]

/**
 * 根据当前 mock 项目列表汇总入库总数与各分类计数
 * @returns 知识库管理页顶部统计卡片数据
 */
export function getMockKbProjectOverview(): KbProjectOverview {
  const categoryCounts = Object.fromEntries(
    KB_CATEGORY_KEYS.map((key) => [key, 0]),
  ) as Record<KbProjectCategory, number>

  for (const project of MOCK_ALL_KB_PROJECTS) {
    categoryCounts[project.category] += 1
  }

  return {
    totalCount: MOCK_ALL_KB_PROJECTS.length,
    categoryCounts,
  }
}

/** 知识库管理页概览 mock 响应 */
export function mockKbProjectOverviewRes(): ApiResponse<KbProjectOverview> {
  return {
    code: 200,
    message: 'ok',
    data: getMockKbProjectOverview(),
  }
}
