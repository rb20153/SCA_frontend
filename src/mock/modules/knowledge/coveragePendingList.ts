import type { ApiResponse, PageResult } from '@/types/common'
import type { CoveragePendingItem, CoveragePendingQueryParams } from '@/types/knowledge'

const PENDING_SEEDS: Omit<CoveragePendingItem, 'pendingId'>[] = [
  {
    projectName: 'boost',
    gapDescription: '漏洞映射率不足',
    impact: 'medium',
    suggestedAction: '补跑 OSV 交叉映射',
  },
  {
    projectName: 'fmt',
    gapDescription: '目录树不完整',
    impact: 'low',
    suggestedAction: '重新上传源码包',
  },
  {
    projectName: 'protobuf',
    gapDescription: '版本快照缺失',
    impact: 'high',
    suggestedAction: '执行获取更新并补快照',
  },
  {
    projectName: 'openssl',
    gapDescription: 'CVE 关联滞后',
    impact: 'high',
    suggestedAction: '触发漏洞源全量同步',
  },
  {
    projectName: 'eigen',
    gapDescription: '目录索引缺页',
    impact: 'medium',
    suggestedAction: '重新拉取云端仓库',
  },
  {
    projectName: 'curl',
    gapDescription: '许可证元数据缺失',
    impact: 'low',
    suggestedAction: '补充 SPDX 元数据导入',
  },
  {
    projectName: 'zlib',
    gapDescription: '版本基线未对齐',
    impact: 'medium',
    suggestedAction: '在版本管理中获取更新',
  },
  {
    projectName: 'openfoam',
    gapDescription: '漏洞映射率不足',
    impact: 'high',
    suggestedAction: '补跑 OSV 交叉映射',
  },
  {
    projectName: 'gtest',
    gapDescription: '采集方式未登记',
    impact: 'low',
    suggestedAction: '在知识库管理中完善采集方式',
  },
]

const MOCK_PENDING_TOTAL = PENDING_SEEDS.length

/**
 * 分页返回待补全清单 mock
 * @param params - 分页参数
 */
export function getMockCoveragePendingListPage(
  params: CoveragePendingQueryParams,
): ApiResponse<PageResult<CoveragePendingItem>> {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 6

  const list: CoveragePendingItem[] = PENDING_SEEDS.map((seed, index) => ({
    pendingId: `pending-${String(index + 1).padStart(3, '0')}`,
    ...seed,
  }))

  const start = (page - 1) * pageSize
  const pageList = list.slice(start, start + pageSize)

  return {
    code: 200,
    message: 'ok',
    data: {
      list: pageList,
      total: MOCK_PENDING_TOTAL,
      page,
      pageSize,
    },
  }
}
