import type { ApiResponse } from '@/types/common'
import type { CoverageUpdateTrendWeek } from '@/types/knowledge'

/** 最近三周更新趋势列表 mock */
export const mockCoverageUpdateTrendWeeksRes: ApiResponse<CoverageUpdateTrendWeek[]> = {
  code: 200,
  message: 'ok',
  data: [
    {
      weekLabel: 'W20',
      summary: '补录 7 个工具链项目目录',
    },
    {
      weekLabel: 'W19',
      summary: '新增漏洞源 GitHub Advisory',
    },
    {
      weekLabel: 'W18',
      summary: 'OpenFOAM / Eigen 两个大版本更新完成',
    },
  ],
}
