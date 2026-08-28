<template>
  <a-card :bordered="false" class="risk-component-graph">
    <div class="risk-component-graph__header">
      <h3 class="risk-component-graph__title">组件依赖关系图</h3>
      <div class="risk-component-graph__legend">
        <span v-for="item in RISK_LEGEND" :key="item.value" class="legend-item">
          <i class="legend-dot" :style="{ background: item.color }" />
          {{ item.label }}
        </span>
      </div>
    </div>

    <div class="risk-component-graph__body">
      <div ref="graphRef" class="risk-component-graph__canvas" />
      <a-empty
        v-if="isEmpty"
        class="risk-component-graph__empty"
        description="暂无依赖关系数据"
      />
    </div>
  </a-card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ElementDatum, GraphData, IElementEvent, NodeData } from '@antv/g6'

import { useG6Graph } from '@/composables/useG6Graph'
import type {
  RiskComponentGraph,
  RiskComponentGraphNode,
  RiskComponentGraphRiskLevel,
} from '@/types/detect'

const props = defineProps<{
  /** 依赖图数据（节点 + 边）；未加载时为 null */
  graph: RiskComponentGraph | null
}>()

const emit = defineEmits<{
  /** 点击组件节点（非根）时上抛 componentId，供父级打开详情抽屉 */
  (e: 'select', componentId: string): void
}>()

const graphRef = ref<HTMLElement | null>(null)

/** 风险等级 → 低饱和度配色（与项目其余图表保持一致） */
const RISK_COLOR: Record<RiskComponentGraphRiskLevel, string> = {
  high: '#e89a9a',
  medium: '#e8c79a',
  low: '#a7cfa0',
  none: '#c9ccd1',
}

/** 风险等级中文文案 */
const RISK_LABEL: Record<RiskComponentGraphRiskLevel, string> = {
  high: '高危',
  medium: '中危',
  low: '低危',
  none: '无风险',
}

/** 根节点配色（被测项目本身） */
const ROOT_COLOR = '#7aa7e0'

/** 图例项 */
const RISK_LEGEND = [
  { value: 'root', label: '被测项目', color: ROOT_COLOR },
  { value: 'high', label: '高危', color: RISK_COLOR.high },
  { value: 'medium', label: '中危', color: RISK_COLOR.medium },
  { value: 'low', label: '低危', color: RISK_COLOR.low },
  { value: 'none', label: '无风险', color: RISK_COLOR.none },
] as const

const isEmpty = computed(() => !props.graph || props.graph.nodes.length === 0)

/** 从 G6 节点数据还原业务节点对象 */
function readNode(datum: NodeData | ElementDatum): RiskComponentGraphNode {
  return datum.data as unknown as RiskComponentGraphNode
}

/** 业务依赖图数据 → G6 GraphData，节点完整对象塞进 data 供样式/tooltip 读取 */
function toGraphData(graph: RiskComponentGraph): GraphData {
  const compact = isSingleRootGraph(graph)
  return {
    nodes: graph.nodes.map((node) => ({ id: node.id, data: { ...node, compact } })),
    edges: graph.edges.map((edge) => ({ source: edge.source, target: edge.target })),
  }
}

/** 仅有被测项目根节点、没有组件依赖的紧凑展示态。 */
function isSingleRootGraph(graph: RiskComponentGraph): boolean {
  return graph.nodes.length === 1 && graph.nodes[0].isRoot
}

/** 图中仅有项目根节点时，避免自动适配将节点与文字放大。 */
function isCompactNode(datum: NodeData): boolean {
  return Boolean((datum.data as Record<string, unknown> | undefined)?.compact)
}

/** 节点文字最多两行，超出部分以省略号截断，完整名称仍可在 tooltip 查看。 */
function formatNodeLabel(text: string, maxCharsPerLine: number): string {
  const normalized = text.trim()
  const maxLength = maxCharsPerLine * 2
  const truncated = normalized.length > maxLength ? `${normalized.slice(0, maxLength - 1)}…` : normalized
  return truncated.match(new RegExp(`.{1,${maxCharsPerLine}}`, 'g'))?.join('\n') ?? ''
}

/** 布局完成后再适配视口，避免子节点尚未定位时出现偏移。 */
async function fitGraphViewport(graph: ReturnType<typeof getInstance>, graphData: RiskComponentGraph) {
  if (!graph) return
  if (isSingleRootGraph(graphData)) {
    await graph.fitCenter()
  } else {
    await graph.fitView()
  }
}

const { updateData, getInstance } = useG6Graph(
  graphRef,
  {
    animation: true,
    padding: 16,
    layout: { type: 'antv-dagre', rankdir: 'TB', nodesep: 28, ranksep: 52 },
    node: {
      type: 'rect',
      style: {
        size: (d: NodeData) => (isCompactNode(d) ? [161, 49] : [124, 36]),
        radius: 6,
        fill: (d: NodeData) => {
          const node = readNode(d)
          return node.isRoot ? ROOT_COLOR : RISK_COLOR[node.riskLevel]
        },
        stroke: 'rgba(0, 0, 0, 0.06)',
        lineWidth: 1,
        labelText: (d: NodeData) => {
          const node = readNode(d)
          const label = node.isRoot ? node.componentName : `${node.componentName}@${node.version}`
          return formatNodeLabel(label, isCompactNode(d) ? 9 : 14)
        },
        labelPlacement: 'center',
        labelFill: 'rgba(0, 0, 0, 0.85)',
        labelFontSize: (d: NodeData) => (isCompactNode(d) ? 14 : 12),
      },
    },
    edge: {
      type: 'cubic-vertical',
      style: {
        stroke: '#d0d4da',
        lineWidth: 1.5,
        endArrow: true,
      },
    },
    behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element', 'hover-activate'],
    plugins: [
      {
        type: 'tooltip',
        trigger: 'hover',
        enable: (event: IElementEvent) => event.targetType === 'node',
        getContent: (_event: IElementEvent, items: ElementDatum[]) => {
          const node = items[0] ? readNode(items[0]) : null
          if (!node) {
            return Promise.resolve('')
          }
          const title = node.isRoot ? node.componentName : `${node.componentName}@${node.version}`
          const rows = node.isRoot
            ? ''
            : `<div>风险等级：${RISK_LABEL[node.riskLevel]}</div>` +
              `<div>关联漏洞：${node.vulnerabilityCount} 条</div>`
          return Promise.resolve(
            `<div style="font-size:12px;line-height:1.6"><strong>${title}</strong>${rows}</div>`,
          )
        },
      },
      { type: 'minimap', size: [150, 100] },
    ],
  },
  // 实例就绪后绑定节点点击：非根节点上抛 componentId
  (graph) => {
    graph.on('node:click', (event: IElementEvent) => {
      const id = String(event.target.id)
      if (id && !id.endsWith('-root')) {
        emit('select', id)
      }
    })
    graph.once('afterrender', () => {
      const graphData = props.graph
      if (!graphData || graphData.nodes.length === 0) return
      void fitGraphViewport(graph, graphData)
    })
  },
)

watch(
  () => props.graph,
  async (graph) => {
    if (graph && graph.nodes.length > 0) {
      await updateData(toGraphData(graph))
      await fitGraphViewport(getInstance(), graph)
    }
  },
  { immediate: true },
)
</script>

<style scoped>
.risk-component-graph {
  margin-bottom: 16px;
}

.risk-component-graph__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.risk-component-graph__title {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.88);
}

.risk-component-graph__legend {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.65);
}

.legend-item {
  display: inline-flex;
  align-items: center;
}

.legend-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  margin-right: 4px;
  border-radius: 2px;
}

.risk-component-graph__body {
  position: relative;
  height: 360px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
}

.risk-component-graph__canvas {
  width: 100%;
  height: 100%;
}

.risk-component-graph__empty {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  margin: 0;
}
</style>
