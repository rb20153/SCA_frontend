import type { RiskSourceMode } from '@/types/common'
import type {
  OpenSourceRiskComponent,
  OpenSourceRiskComponentDetail,
  OpenSourceRiskComponentIdentifyBasis,
  OpenSourceRiskComponentIgnoreReason,
  OpenSourceRiskComponentRiskLevel,
} from '@/types/detect'

interface ComponentSeed {
  componentName: string
  version: string
  license: string
  identifyBasis: OpenSourceRiskComponentIdentifyBasis
  identifyBasisLabel: string
  sourceMode: RiskSourceMode
  riskLevel: OpenSourceRiskComponentRiskLevel
}

const COMPONENT_SEEDS: ComponentSeed[] = [
  {
    componentName: 'openssl',
    version: '3.0.8',
    license: 'Apache-2.0',
    identifyBasis: 'cmake',
    identifyBasisLabel: 'CMakeLists.txt',
    sourceMode: 'project-scan',
    riskLevel: 'medium',
  },
  {
    componentName: 'boost',
    version: '1.82.0',
    license: 'BSL-1.0',
    identifyBasis: 'cmake',
    identifyBasisLabel: 'CMakeLists.txt',
    sourceMode: 'project-scan',
    riskLevel: 'low',
  },
  {
    componentName: 'xz-utils',
    version: '5.6.0',
    license: 'GPL-2.0',
    identifyBasis: 'symbol',
    identifyBasisLabel: '符号匹配',
    sourceMode: 'project-scan',
    riskLevel: 'high',
  },
  {
    componentName: 'fmt',
    version: '10.2.1',
    license: 'MIT',
    identifyBasis: 'manifest',
    identifyBasisLabel: '包管理清单',
    sourceMode: 'import-sbom',
    riskLevel: 'low',
  },
  {
    componentName: 'spdlog',
    version: '1.12.0',
    license: 'MIT',
    identifyBasis: 'sbom',
    identifyBasisLabel: 'SBOM 导入',
    sourceMode: 'import-sbom',
    riskLevel: 'low',
  },
  {
    componentName: 'zlib',
    version: '1.3.1',
    license: 'Zlib',
    identifyBasis: 'cmake',
    identifyBasisLabel: 'CMakeLists.txt',
    sourceMode: 'project-scan',
    riskLevel: 'medium',
  },
  {
    componentName: 'curl',
    version: '8.4.0',
    license: 'MIT',
    identifyBasis: 'symbol',
    identifyBasisLabel: '符号匹配',
    sourceMode: 'project-scan',
    riskLevel: 'high',
  },
  {
    componentName: 'jsoncpp',
    version: '1.9.5',
    license: 'MIT',
    identifyBasis: 'manifest',
    identifyBasisLabel: '包管理清单',
    sourceMode: 'import-sbom',
    riskLevel: 'low',
  },
]

const MOCK_COMPONENT_TOTAL = 36

/** 按任务 ID 生成组件 mock 池（不同任务 ID 顺序略有差异） */
function buildMockComponentsForTask(taskId: string): OpenSourceRiskComponent[] {
  const offset = Number.parseInt(taskId.replace(/\D/g, ''), 10) || 0

  return Array.from({ length: MOCK_COMPONENT_TOTAL }, (_, index) => {
    const seed = COMPONENT_SEEDS[(index + offset) % COMPONENT_SEEDS.length]
    const seq = index + 1
    const suffix = seq > COMPONENT_SEEDS.length ? `-${seq}` : ''

    return {
      componentId: `${taskId}-comp-${String(seq).padStart(3, '0')}`,
      componentName: suffix ? `${seed.componentName}${suffix}` : seed.componentName,
      version: seed.version,
      license: seed.license,
      identifyBasis: seed.identifyBasis,
      identifyBasisLabel: seed.identifyBasisLabel,
      sourceMode: seed.sourceMode,
      riskLevel: seed.riskLevel,
      ignored: false,
      ignoreReason: null,
    }
  })
}

const componentCache = new Map<string, OpenSourceRiskComponent[]>()

/** 任务下已忽略组件：componentId → 忽略原因 */
const ignoredComponentMap = new Map<string, Map<string, OpenSourceRiskComponentIgnoreReason>>()

/** 获取某任务的忽略状态 Map（懒创建） */
function getTaskIgnoredMap(taskId: string): Map<string, OpenSourceRiskComponentIgnoreReason> {
  let map = ignoredComponentMap.get(taskId)
  if (!map) {
    map = new Map()
    ignoredComponentMap.set(taskId, map)
  }
  return map
}

/** 将 mock 池中的组件与忽略状态合并 */
function withIgnoreState(
  taskId: string,
  component: OpenSourceRiskComponent,
): OpenSourceRiskComponent {
  const reason = getTaskIgnoredMap(taskId).get(component.componentId)
  if (!reason) {
    return { ...component, ignored: false, ignoreReason: null }
  }
  return { ...component, ignored: true, ignoreReason: reason }
}

/** 返回某任务当前已忽略组件数量（供统计卡片扣减） */
export function getMockOpenSourceRiskIgnoredComponentCount(taskId: string): number {
  return getTaskIgnoredMap(taskId).size
}

/** 获取某任务的组件 mock 全量列表 */
function getTaskComponentPool(taskId: string): OpenSourceRiskComponent[] {
  const cached = componentCache.get(taskId)
  if (cached) {
    return cached
  }
  const pool = buildMockComponentsForTask(taskId)
  componentCache.set(taskId, pool)
  return pool
}

export interface MockOpenSourceRiskComponentQuery {
  componentName?: string
  sourceMode?: RiskSourceMode
  riskLevel?: OpenSourceRiskComponentRiskLevel
  includeIgnored?: boolean
  page?: number
  pageSize?: number
}

/**
 * mock：分页返回开源风险组件清单
 * @param taskId - 任务 ID
 * @param params - 筛选与分页
 */
export function getMockOpenSourceRiskComponentPage(
  taskId: string,
  params: MockOpenSourceRiskComponentQuery,
) {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 10
  const keyword = params.componentName?.trim()

  let list = getTaskComponentPool(taskId).map((item) => withIgnoreState(taskId, item))

  if (keyword) {
    list = list.filter((item) => item.componentName.includes(keyword))
  }
  if (params.sourceMode) {
    list = list.filter((item) => item.sourceMode === params.sourceMode)
  }
  if (params.riskLevel) {
    list = list.filter((item) => item.riskLevel === params.riskLevel)
  }
  if (!params.includeIgnored) {
    list = list.filter((item) => !item.ignored)
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

/** 提取组件基础名（去掉 mock 序号后缀如 openssl-7 → openssl） */
export function getMockComponentBaseName(componentName: string): string {
  const match = componentName.match(/^(.+?)-\d+$/)
  return match ? match[1] : componentName
}

/** 识别依据详细说明 mock 文案 */
function buildIdentifyBasisDetail(component: OpenSourceRiskComponent): string {
  switch (component.identifyBasis) {
    case 'cmake':
      return `在 ${component.identifyBasisLabel} 中声明依赖 ${component.componentName}@${component.version}，示例路径 third_party/${getMockComponentBaseName(component.componentName)}/CMakeLists.txt:42`
    case 'symbol':
      return `通过二进制符号表匹配到 lib${getMockComponentBaseName(component.componentName)}.so 中与 ${component.componentName}@${component.version} 一致的导出符号`
    case 'manifest':
      return `在包管理清单（conan/vcpkg）中解析到 ${component.componentName}@${component.version} 的显式依赖声明`
    case 'sbom':
      return `自导入 SBOM 文件中读取组件坐标 ${component.componentName}@${component.version}，供应商字段与 SPDX 清单一致`
    default:
      return component.identifyBasisLabel
  }
}

/**
 * mock：获取组件详情
 * @param taskId - 任务 ID
 * @param componentId - 组件 ID
 */
export function getMockOpenSourceRiskComponentDetail(
  taskId: string,
  componentId: string,
): OpenSourceRiskComponentDetail | undefined {
  const component = getTaskComponentPool(taskId).find((item) => item.componentId === componentId)
  if (!component) {
    return undefined
  }

  const merged = withIgnoreState(taskId, component)

  return {
    ...merged,
    identifyBasisDetail: buildIdentifyBasisDetail(component),
    relatedVulnerabilityCount: 0, // filled by API layer after cross-module count
  }
}

/**
 * mock：忽略组件
 * @param taskId - 任务 ID
 * @param componentId - 组件 ID
 * @param reason - 忽略原因
 */
export function mockIgnoreOpenSourceRiskComponent(
  taskId: string,
  componentId: string,
  reason: OpenSourceRiskComponentIgnoreReason,
): boolean {
  const exists = getTaskComponentPool(taskId).some((item) => item.componentId === componentId)
  if (!exists) {
    return false
  }
  getTaskIgnoredMap(taskId).set(componentId, reason)
  return true
}

/**
 * mock：撤销忽略组件
 * @param taskId - 任务 ID
 * @param componentId - 组件 ID
 */
export function mockRevokeOpenSourceRiskComponentIgnore(
  taskId: string,
  componentId: string,
): boolean {
  return getTaskIgnoredMap(taskId).delete(componentId)
}
