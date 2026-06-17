import type { ApiResponse } from '@/types/common'
import type { CoverageUpdateTrendWeek } from '@/types/knowledge'

/** 最近六周更新趋势列表 mock */
export const mockCoverageUpdateTrendWeeksRes: ApiResponse<CoverageUpdateTrendWeek[]> = {
  code: 200,
  message: 'ok',
  data: [
    {
      weekLabel: 'W15',
      addedProjectCount: 3,
      completedDirectoryCount: 11,
      vulnMappingUpdateCount: 18,
      summary: '补齐旧版工具链目录索引，完成首批漏洞映射回填',
    },
    {
      weekLabel: 'W16',
      addedProjectCount: 4,
      completedDirectoryCount: 14,
      vulnMappingUpdateCount: 22,
      summary: '新增数值计算项目版本，目录索引完整率持续提升',
    },
    {
      weekLabel: 'W17',
      addedProjectCount: 5,
      completedDirectoryCount: 16,
      vulnMappingUpdateCount: 27,
      summary: '完成仿真框架基线复核，批量刷新组件漏洞映射',
    },
    {
      weekLabel: 'W18',
      addedProjectCount: 6,
      completedDirectoryCount: 20,
      vulnMappingUpdateCount: 34,
      summary: 'OpenFOAM / Eigen 两个大版本更新完成',
    },
    {
      weekLabel: 'W19',
      addedProjectCount: 4,
      completedDirectoryCount: 18,
      vulnMappingUpdateCount: 41,
      summary: '新增漏洞源 GitHub Advisory',
    },
    {
      weekLabel: 'W20',
      addedProjectCount: 7,
      completedDirectoryCount: 24,
      vulnMappingUpdateCount: 46,
      summary: '补录 7 个工具链项目目录',
    },
  ],
}
