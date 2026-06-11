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
      successRate: 94,
      avgDurationMinutes: 16,
    },
    {
      method: '上传源码包',
      projectCount: 41,
      successRate: 98,
      avgDurationMinutes: 9,
    },
  ],
}
