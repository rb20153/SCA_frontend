import type {
  ImportOfflineVulnPackageParams,
  SyncVulnSourceParams,
  VulnSource,
  VulnSourceCode,
  VulnSourceQueryParams,
  VulnSyncAllPreview,
  VulnSyncStatus,
} from '@/types/knowledge'
import { VULN_SOURCE_CODE_LABEL } from '@/utils/vulnKnowledgeDisplay'
import dayjs from 'dayjs'

interface BuiltinSourceSeed {
  sourceCode: VulnSourceCode
  sourceType: string
  recordCount: number
  highRiskCount: number
  syncCycle: string
  hoursAgo: number
  syncStatus: VulnSyncStatus
}

const BUILTIN_SEEDS: BuiltinSourceSeed[] = [
  {
    sourceCode: 'nvd',
    sourceType: '官方漏洞库',
    recordCount: 4860,
    highRiskCount: 188,
    syncCycle: '每日',
    hoursAgo: 2,
    syncStatus: 'normal',
  },
  {
    sourceCode: 'cnvd',
    sourceType: '国家通报库',
    recordCount: 1320,
    highRiskCount: 54,
    syncCycle: '每日',
    hoursAgo: 5,
    syncStatus: 'normal',
  },
  {
    sourceCode: 'osv',
    sourceType: '开源生态库',
    recordCount: 1940,
    highRiskCount: 46,
    syncCycle: '每 6 小时',
    hoursAgo: 3,
    syncStatus: 'normal',
  },
  {
    sourceCode: 'github_advisory',
    sourceType: '社区安全公告',
    recordCount: 300,
    highRiskCount: 24,
    syncCycle: '每周',
    hoursAgo: 72,
    syncStatus: 'delayed',
  },
]

/** 构建内置漏洞来源 mock 项 */
function buildBuiltinSource(seed: BuiltinSourceSeed, index: number): VulnSource {
  const sourceName = VULN_SOURCE_CODE_LABEL[seed.sourceCode]
  return {
    sourceId: `vsrc-builtin-${String(index + 1).padStart(2, '0')}`,
    kind: 'builtin',
    sourceCode: seed.sourceCode,
    sourceName,
    sourceType: seed.sourceType,
    recordCount: seed.recordCount,
    highRiskCount: seed.highRiskCount,
    syncCycle: seed.syncCycle,
    lastSyncedAt: dayjs().subtract(seed.hoursAgo, 'hour').toISOString(),
    syncStatus: seed.syncStatus,
  }
}

const MOCK_BUILTIN_SOURCES: VulnSource[] = BUILTIN_SEEDS.map(buildBuiltinSource)

/** 用户上传的离线漏洞包（示例） */
const MOCK_OFFLINE_SOURCES: VulnSource[] = [
  {
    sourceId: 'vsrc-offline-001',
    kind: 'offline_upload',
    sourceCode: null,
    sourceName: '离线-NVD-202605',
    sourceType: '上传离线包',
    recordCount: null,
    highRiskCount: null,
    syncCycle: null,
    lastSyncedAt: dayjs().subtract(3, 'day').startOf('day').add(14, 'hour').toISOString(),
    syncStatus: 'normal',
  },
]

let mockOfflineSources = [...MOCK_OFFLINE_SOURCES]

/** 当前全量漏洞来源（内置 + 离线包） */
function getAllVulnSources(): VulnSource[] {
  return [...MOCK_BUILTIN_SOURCES, ...mockOfflineSources]
}

/** 按 ID 获取漏洞来源 mock */
export function getMockVulnSourceById(sourceId: string): VulnSource | null {
  return getAllVulnSources().find((item) => item.sourceId === sourceId) ?? null
}

/** 来源筛选仅匹配来源名称 */
function matchesSourceName(source: VulnSource, keyword: string): boolean {
  return source.sourceName.toLowerCase().includes(keyword.toLowerCase())
}

/** mock 阶段按条件过滤漏洞来源列表 */
export function filterMockVulnSourceList(params: VulnSourceQueryParams): VulnSource[] {
  let list = getAllVulnSources()

  if (params.sourceName?.trim()) {
    const sourceKeyword = params.sourceName.trim()
    list = list.filter((item) => matchesSourceName(item, sourceKeyword))
  }

  if (params.syncStatus) {
    list = list.filter((item) => item.syncStatus === params.syncStatus)
  }

  return list.sort(
    (a, b) => new Date(b.lastSyncedAt).getTime() - new Date(a.lastSyncedAt).getTime(),
  )
}

/** 全库同步弹窗预览 mock */
export function getMockVulnSyncAllPreview(): VulnSyncAllPreview {
  return {
    sourceNames: MOCK_BUILTIN_SOURCES.map((item) => item.sourceName),
    estimatedMinutes: 12,
  }
}

/** mock 全库同步：刷新所有内置源最近同步时间 */
export function mockSyncAllVulnSources(): void {
  const now = new Date().toISOString()
  MOCK_BUILTIN_SOURCES.forEach((item, index) => {
    MOCK_BUILTIN_SOURCES[index] = {
      ...item,
      lastSyncedAt: now,
      syncStatus: 'normal',
    }
  })
}

/** mock 立即同步单条内置来源 */
export function mockSyncVulnSource(params: SyncVulnSourceParams): VulnSource {
  const index = MOCK_BUILTIN_SOURCES.findIndex((item) => item.sourceId === params.sourceId)
  if (index < 0) {
    throw new Error('漏洞来源不存在或不支持同步')
  }

  const updated: VulnSource = {
    ...MOCK_BUILTIN_SOURCES[index],
    lastSyncedAt: new Date().toISOString(),
    syncStatus: 'normal',
  }

  MOCK_BUILTIN_SOURCES[index] = updated
  return updated
}

/** mock 导入离线漏洞包并写入列表 */
export function mockImportOfflineVulnPackage(params: ImportOfflineVulnPackageParams): VulnSource {
  const sourceTag = params.sourceTag.trim()
  const created: VulnSource = {
    sourceId: `vsrc-offline-${String(mockOfflineSources.length + 1).padStart(3, '0')}`,
    kind: 'offline_upload',
    sourceCode: null,
    sourceName: sourceTag,
    sourceType: '上传离线包',
    recordCount: null,
    highRiskCount: null,
    syncCycle: null,
    lastSyncedAt: new Date().toISOString(),
    syncStatus: 'normal',
  }

  mockOfflineSources = [created, ...mockOfflineSources]
  return created
}
