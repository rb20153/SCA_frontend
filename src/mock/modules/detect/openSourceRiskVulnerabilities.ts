import type { RiskSourceMode } from '@/types/common'
import type {
  OpenSourceRiskComponentRiskLevel,
  OpenSourceRiskVulnerability,
  OpenSourceRiskVulnerabilityProcessingStatus,
} from '@/types/detect'

interface VulnerabilitySeed {
  cveId: string
  componentName: string
  version: string
  riskLevel: OpenSourceRiskComponentRiskLevel
  cvssScore: number
  processingStatus: OpenSourceRiskVulnerabilityProcessingStatus
  sourceMode: RiskSourceMode
}

const VULNERABILITY_SEEDS: VulnerabilitySeed[] = [
  {
    cveId: 'CVE-2024-1234',
    componentName: 'openssl',
    version: '3.0.8',
    riskLevel: 'high',
    cvssScore: 8.5,
    processingStatus: 'pending',
    sourceMode: 'project-scan',
  },
  {
    cveId: 'CVE-2024-3094',
    componentName: 'xz-utils',
    version: '5.6.0',
    riskLevel: 'high',
    cvssScore: 9.1,
    processingStatus: 'needs_review',
    sourceMode: 'project-scan',
  },
  {
    cveId: 'CVE-2023-38545',
    componentName: 'curl',
    version: '8.4.0',
    riskLevel: 'high',
    cvssScore: 7.8,
    processingStatus: 'pending',
    sourceMode: 'project-scan',
  },
  {
    cveId: 'CVE-2024-2201',
    componentName: 'boost',
    version: '1.82.0',
    riskLevel: 'medium',
    cvssScore: 5.4,
    processingStatus: 'verified',
    sourceMode: 'import-sbom',
  },
  {
    cveId: 'CVE-2023-45853',
    componentName: 'zlib',
    version: '1.3.1',
    riskLevel: 'medium',
    cvssScore: 6.2,
    processingStatus: 'verified',
    sourceMode: 'project-scan',
  },
  {
    cveId: 'CVE-2024-0567',
    componentName: 'fmt',
    version: '10.2.1',
    riskLevel: 'low',
    cvssScore: 3.1,
    processingStatus: 'verified',
    sourceMode: 'import-sbom',
  },
]

const MOCK_VULNERABILITY_TOTAL = 28

const vulnerabilityCache = new Map<string, OpenSourceRiskVulnerability[]>()

/** 按任务 ID 生成漏洞 mock 池 */
function buildMockVulnerabilitiesForTask(taskId: string): OpenSourceRiskVulnerability[] {
  const offset = Number.parseInt(taskId.replace(/\D/g, ''), 10) || 0

  return Array.from({ length: MOCK_VULNERABILITY_TOTAL }, (_, index) => {
    const seed = VULNERABILITY_SEEDS[(index + offset) % VULNERABILITY_SEEDS.length]
    const seq = index + 1

    return {
      vulnerabilityId: `${taskId}-vuln-${String(seq).padStart(3, '0')}`,
      cveId: seed.cveId,
      componentName: seed.componentName,
      version: seed.version,
      riskLevel: seed.riskLevel,
      cvssScore: seed.cvssScore,
      processingStatus: seed.processingStatus,
      sourceMode: seed.sourceMode,
    }
  })
}

function getTaskVulnerabilityPool(taskId: string): OpenSourceRiskVulnerability[] {
  const cached = vulnerabilityCache.get(taskId)
  if (cached) {
    return cached
  }
  const pool = buildMockVulnerabilitiesForTask(taskId)
  vulnerabilityCache.set(taskId, pool)
  return pool
}

export interface MockOpenSourceRiskVulnerabilityQuery {
  cveId?: string
  riskLevel?: OpenSourceRiskComponentRiskLevel
  componentName?: string
  processingStatus?: OpenSourceRiskVulnerabilityProcessingStatus
  page?: number
  pageSize?: number
}

/**
 * mock：分页返回开源风险漏洞清单
 * @param taskId - 任务 ID
 * @param params - 筛选与分页
 */
export function getMockOpenSourceRiskVulnerabilityPage(
  taskId: string,
  params: MockOpenSourceRiskVulnerabilityQuery,
) {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 10
  const cveKeyword = params.cveId?.trim().toUpperCase()
  const componentKeyword = params.componentName?.trim()

  let list = getTaskVulnerabilityPool(taskId)

  if (cveKeyword) {
    list = list.filter((item) => item.cveId.toUpperCase().includes(cveKeyword))
  }
  if (componentKeyword) {
    list = list.filter((item) => item.componentName.includes(componentKeyword))
  }
  if (params.riskLevel) {
    list = list.filter((item) => item.riskLevel === params.riskLevel)
  }
  if (params.processingStatus) {
    list = list.filter((item) => item.processingStatus === params.processingStatus)
  }

  const total = list.length
  const start = (page - 1) * pageSize

  return {
    list: list.slice(start, start + pageSize),
    total,
    page,
    pageSize,
  }
}

/**
 * mock：统计与指定组件关联的漏洞条数
 * @param taskId - 任务 ID
 * @param componentName - 组件名（含 mock 后缀时按基础名匹配）
 */
export function countMockOpenSourceRiskVulnerabilitiesByComponent(
  taskId: string,
  componentName: string,
): number {
  const keyword = componentName.trim()
  const baseName = keyword.replace(/-\d+$/, '')

  return getTaskVulnerabilityPool(taskId).filter(
    (item) =>
      item.componentName === keyword ||
      item.componentName === baseName ||
      keyword.includes(item.componentName),
  ).length
}

/** mock：按 ID 查找漏洞清单项 */
export function findMockOpenSourceRiskVulnerability(
  taskId: string,
  vulnerabilityId: string,
): OpenSourceRiskVulnerability | undefined {
  return getTaskVulnerabilityPool(taskId).find((item) => item.vulnerabilityId === vulnerabilityId)
}

/** mock：更新漏洞处理状态 */
export function setMockOpenSourceRiskVulnerabilityStatus(
  taskId: string,
  vulnerabilityId: string,
  processingStatus: OpenSourceRiskVulnerabilityProcessingStatus,
): boolean {
  const item = findMockOpenSourceRiskVulnerability(taskId, vulnerabilityId)
  if (!item) {
    return false
  }
  item.processingStatus = processingStatus
  return true
}
