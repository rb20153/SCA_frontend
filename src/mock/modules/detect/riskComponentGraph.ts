import type {
  RiskComponentGraph,
  RiskComponentGraphEdge,
  RiskComponentGraphNode,
} from '@/types/detect'
import { getMockOpenSourceRiskComponentPage } from '@/mock/modules/detect/openSourceRiskComponents'
import { countMockOpenSourceRiskVulnerabilitiesByComponent } from '@/mock/modules/detect/openSourceRiskVulnerabilities'

/** 复用组件清单前 N 条作为图节点，保证图与清单/详情抽屉数据一致 */
const GRAPH_COMPONENT_COUNT = 9

/** 根节点直接依赖的组件索引（指向组件池前 N 条） */
const DIRECT_DEPENDENCY_INDEXES = [0, 1, 2]

/** 组件间传递依赖：[父索引, 子索引]，构成 2~3 层依赖树 */
const TRANSITIVE_DEPENDENCY_EDGES: Array<[number, number]> = [
  [0, 3],
  [0, 4],
  [1, 5],
  [2, 6],
  [5, 7],
  [6, 8],
]

const graphCache = new Map<string, RiskComponentGraph>()

/** 按边做 BFS，从根节点计算各节点依赖深度 */
function computeDepth(rootId: string, edges: RiskComponentGraphEdge[]): Map<string, number> {
  const adjacency = new Map<string, string[]>()
  edges.forEach((edge) => {
    const targets = adjacency.get(edge.source) ?? []
    targets.push(edge.target)
    adjacency.set(edge.source, targets)
  })

  const depthMap = new Map<string, number>([[rootId, 0]])
  const queue: string[] = [rootId]
  while (queue.length > 0) {
    const current = queue.shift()
    if (current === undefined) break
    const currentDepth = depthMap.get(current) ?? 0
    for (const next of adjacency.get(current) ?? []) {
      if (!depthMap.has(next)) {
        depthMap.set(next, currentDepth + 1)
        queue.push(next)
      }
    }
  }
  return depthMap
}

/**
 * mock：构建某任务的组件依赖关系图
 * 根节点为被测项目，下挂直接依赖与传递依赖，节点复用组件清单数据
 * @param taskId - 任务 ID
 * @returns 依赖图节点与边集合（带缓存，保证同一任务多次调用结果一致）
 */
export function getMockRiskComponentGraph(taskId: string): RiskComponentGraph {
  const cached = graphCache.get(taskId)
  if (cached) {
    return cached
  }

  // 取组件清单前 9 条（含已忽略），复用其名称/版本/风险，避免图与列表对不上
  const components = getMockOpenSourceRiskComponentPage(taskId, {
    page: 1,
    pageSize: GRAPH_COMPONENT_COUNT,
    includeIgnored: true,
  }).list

  const rootId = `${taskId}-root`
  const edges: RiskComponentGraphEdge[] = []

  // 根 → 直接依赖
  DIRECT_DEPENDENCY_INDEXES.forEach((index) => {
    const target = components[index]
    if (target) {
      edges.push({ source: rootId, target: target.componentId })
    }
  })
  // 组件间传递依赖
  TRANSITIVE_DEPENDENCY_EDGES.forEach(([parentIndex, childIndex]) => {
    const parent = components[parentIndex]
    const child = components[childIndex]
    if (parent && child) {
      edges.push({ source: parent.componentId, target: child.componentId })
    }
  })

  const depthMap = computeDepth(rootId, edges)

  const nodes: RiskComponentGraphNode[] = [
    {
      id: rootId,
      componentName: '被测项目',
      version: '',
      isRoot: true,
      riskLevel: 'none',
      vulnerabilityCount: 0,
      depth: 0,
    },
    ...components.map((component) => ({
      id: component.componentId,
      componentName: component.componentName,
      version: component.version,
      isRoot: false,
      riskLevel: component.riskLevel,
      vulnerabilityCount: countMockOpenSourceRiskVulnerabilitiesByComponent(
        taskId,
        component.componentName,
      ),
      depth: depthMap.get(component.componentId) ?? 1,
    })),
  ]

  const graph: RiskComponentGraph = { nodes, edges }
  graphCache.set(taskId, graph)
  return graph
}
