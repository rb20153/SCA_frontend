import type {
  SyncVulnSourceParams,
  VulnSource,
  VulnSourceCode,
  VulnSourceQueryParams,
  VulnSyncStatus,
} from '@/types/knowledge'
import dayjs from 'dayjs'

interface VulnSourceSeed {
  sourceCode: VulnSourceCode
  sourceName: string
  sourceType: string
  description: string
  tags: string[]
  recordCount: number
  highRiskCount: number
  syncCycle: string
  hoursAgo: number
  syncStatus: VulnSyncStatus
}

const PRIMARY_SEEDS: VulnSourceSeed[] = [
  {
    sourceCode: 'nvd',
    sourceName: 'NVD',
    sourceType: '官方漏洞库',
    description: '美国国家漏洞数据库，覆盖 CVE 官方描述与 CVSS 评分',
    tags: ['CVE', 'CVSS', '官方'],
    recordCount: 4860,
    highRiskCount: 188,
    syncCycle: '每日',
    hoursAgo: 2,
    syncStatus: 'normal',
  },
  {
    sourceCode: 'cnvd',
    sourceName: 'CNVD',
    sourceType: '国家通报库',
    description: '国家信息安全漏洞共享平台通报数据',
    tags: ['CNVD', '国内', '通报'],
    recordCount: 1320,
    highRiskCount: 54,
    syncCycle: '每日',
    hoursAgo: 5,
    syncStatus: 'normal',
  },
  {
    sourceCode: 'osv',
    sourceName: 'OSV',
    sourceType: '开源生态库',
    description: '开源软件漏洞数据库，覆盖 npm、PyPI、Go 等生态',
    tags: ['开源', '生态', 'OSV'],
    recordCount: 1940,
    highRiskCount: 46,
    syncCycle: '每 6 小时',
    hoursAgo: 3,
    syncStatus: 'normal',
  },
  {
    sourceCode: 'github_advisory',
    sourceName: 'GitHub Advisory',
    sourceType: '社区安全公告',
    description: 'GitHub 安全公告与 Dependabot 关联数据源',
    tags: ['GitHub', '社区', 'Advisory'],
    recordCount: 300,
    highRiskCount: 24,
    syncCycle: '每周',
    hoursAgo: 72,
    syncStatus: 'delayed',
  },
]

const EXTRA_SEEDS: VulnSourceSeed[] = [
  {
    sourceCode: 'nvd',
    sourceName: 'NVD 离线镜像',
    sourceType: '离线镜像库',
    description: '内网离线同步的 NVD 快照，用于无外网环境',
    tags: ['离线', 'NVD', '镜像'],
    recordCount: 2100,
    highRiskCount: 92,
    syncCycle: '每周',
    hoursAgo: 120,
    syncStatus: 'warning',
  },
  {
    sourceCode: 'osv',
    sourceName: 'OSV PyPI 专项',
    sourceType: '生态专项库',
    description: '聚焦 Python PyPI 生态的 OSV 增量源',
    tags: ['PyPI', 'Python', 'OSV'],
    recordCount: 680,
    highRiskCount: 31,
    syncCycle: '每 12 小时',
    hoursAgo: 14,
    syncStatus: 'delayed',
  },
  {
    sourceCode: 'cnvd',
    sourceName: 'CNVD 工业控制',
    sourceType: '行业专项库',
    description: '工业控制系统相关漏洞通报专项采集',
    tags: ['工控', 'CNVD', '专项'],
    recordCount: 420,
    highRiskCount: 18,
    syncCycle: '每日',
    hoursAgo: 8,
    syncStatus: 'normal',
  },
  {
    sourceCode: 'github_advisory',
    sourceName: 'GitHub Go 生态',
    sourceType: '生态专项库',
    description: 'Go 模块相关 GitHub 安全公告聚合',
    tags: ['Go', 'GitHub', '模块'],
    recordCount: 156,
    highRiskCount: 12,
    syncCycle: '每 3 天',
    hoursAgo: 96,
    syncStatus: 'warning',
  },
]

function buildSource(seed: VulnSourceSeed, index: number): VulnSource {
  return {
    sourceId: `vsrc-${String(index + 1).padStart(3, '0')}`,
    sourceCode: seed.sourceCode,
    sourceName: seed.sourceName,
    sourceType: seed.sourceType,
    description: seed.description,
    tags: seed.tags,
    recordCount: seed.recordCount,
    highRiskCount: seed.highRiskCount,
    syncCycle: seed.syncCycle,
    lastSyncedAt: dayjs().subtract(seed.hoursAgo, 'hour').toISOString(),
    syncStatus: seed.syncStatus,
  }
}

const MOCK_ALL_VULN_SOURCES: VulnSource[] = [...PRIMARY_SEEDS, ...EXTRA_SEEDS].map(buildSource)

function matchesKeyword(source: VulnSource, keyword: string): boolean {
  const lower = keyword.toLowerCase()
  const tagText = source.tags.join(' ').toLowerCase()

  return (
    source.sourceName.toLowerCase().includes(lower) ||
    source.description.toLowerCase().includes(lower) ||
    tagText.includes(lower)
  )
}

/** mock 阶段按条件过滤漏洞来源列表 */
export function filterMockVulnSourceList(params: VulnSourceQueryParams): VulnSource[] {
  let list = [...MOCK_ALL_VULN_SOURCES]

  if (params.sourceCode) {
    list = list.filter((item) => item.sourceCode === params.sourceCode)
  }

  if (params.syncStatus) {
    list = list.filter((item) => item.syncStatus === params.syncStatus)
  }

  if (params.keyword?.trim()) {
    const keyword = params.keyword.trim()
    list = list.filter((item) => matchesKeyword(item, keyword))
  }

  return list.sort(
    (a, b) => new Date(b.lastSyncedAt).getTime() - new Date(a.lastSyncedAt).getTime(),
  )
}

/** mock 立即同步：更新最近同步时间并将状态置为正常 */
export function mockSyncVulnSource(params: SyncVulnSourceParams): VulnSource {
  const index = MOCK_ALL_VULN_SOURCES.findIndex((item) => item.sourceId === params.sourceId)
  if (index < 0) {
    throw new Error('漏洞来源不存在')
  }

  const updated: VulnSource = {
    ...MOCK_ALL_VULN_SOURCES[index],
    lastSyncedAt: new Date().toISOString(),
    syncStatus: 'normal',
  }

  MOCK_ALL_VULN_SOURCES[index] = updated
  return updated
}
