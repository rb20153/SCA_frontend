import type { ApiResponse } from '@/types/common'
import type { CollectionMethodCoverageStat } from '@/types/knowledge'

/** 采集方式覆盖统计 mock 列表 */
export const mockCollectionMethodCoverageStatsRes: ApiResponse<
  CollectionMethodCoverageStat[]
> = {
  code: 200,
  message: 'ok',
  data: [
    {
      method: '云端仓库拉取',
      projectCount: 61,
      categoryCounts: [
        { category: '仿真框架', projectCount: 27 },
        { category: '数值计算', projectCount: 16 },
        { category: '前后处理', projectCount: 10 },
        { category: '通用依赖', projectCount: 8 },
      ],
      successRate: 94,
      avgDurationMinutes: 16,
    },
    {
      method: '上传源码包',
      projectCount: 41,
      categoryCounts: [
        { category: '仿真框架', projectCount: 15 },
        { category: '数值计算', projectCount: 12 },
        { category: '前后处理', projectCount: 8 },
        { category: '通用依赖', projectCount: 6 },
      ],
      successRate: 98,
      avgDurationMinutes: 9,
    },
  ],
}
