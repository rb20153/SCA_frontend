import type { ApiResponse } from '@/types/common'
import type { CategoryCoverageStat } from '@/types/knowledge'

/** 分类覆盖统计 mock 列表 */
export const mockCategoryCoverageStatsRes: ApiResponse<CategoryCoverageStat[]> = {
  code: 200,
  message: 'ok',
  data: [
    {
      category: '仿真框架',
      projectCount: 42,
      versionCount: 160,
      directoryCoverageRate: 97,
      vulnMappingRate: 92,
    },
    {
      category: '数值计算',
      projectCount: 28,
      versionCount: 108,
      directoryCoverageRate: 95,
      vulnMappingRate: 86,
    },
    {
      category: '工具链',
      projectCount: 32,
      versionCount: 118,
      directoryCoverageRate: 98,
      vulnMappingRate: 84,
    },
  ],
}
