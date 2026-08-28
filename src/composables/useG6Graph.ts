import { nextTick, onActivated, onDeactivated, onMounted, onUnmounted, type Ref } from 'vue'
import { Graph, type GraphOptions, type GraphData } from '@antv/g6'

/**
 * 封装 AntV G6 生命周期：init → render → resize → destroy。
 * 与 useECharts 保持一致的生命周期策略：
 * - nextTick 后再 init，确保容器已挂载
 * - onActivated/onDeactivated 适配 KeepAlive，切走销毁、切回重建
 * - ResizeObserver 跟随容器尺寸自适应
 * - 缓存最近数据，重建实例时自动重放
 * 禁止在组件里直接 new Graph()，统一走本 composable。
 * @param domRef - 图容器的模板 ref
 * @param config - G6 Graph 配置（container 由本 composable 注入）
 * @param onReady - 实例创建后、render 前的回调，用于绑定事件（每次重建都会重新触发）
 */
export function useG6Graph(
  domRef: Ref<HTMLElement | null>,
  config: Omit<GraphOptions, 'container'>,
  onReady?: (graph: Graph) => void,
) {
  let graph: Graph | null = null
  let resizeObserver: ResizeObserver | null = null
  // 缓存最近一次数据，切回页面重建实例时重放，行为与 useECharts 对齐
  let lastData: GraphData | null = null

  /** 初始化 G6 实例并绑定容器尺寸监听；若已有缓存数据则一并渲染 */
  function initGraph() {
    if (graph || !domRef.value) return
    graph = new Graph({ container: domRef.value, ...config })

    resizeObserver = new ResizeObserver(() => {
      graph?.resize()
    })
    resizeObserver.observe(domRef.value)

    // render 前绑定事件，确保切回页面重建实例后事件依旧生效
    onReady?.(graph)

    if (lastData) {
      graph.setData(lastData)
    }
    graph.render()
  }

  /** 销毁 G6 实例并断开 ResizeObserver，避免 KeepAlive 切换时内存泄漏 */
  function disposeGraph() {
    resizeObserver?.disconnect()
    resizeObserver = null
    graph?.destroy()
    graph = null
  }

  /**
   * 更新图数据；实例尚未就绪时先缓存，待 init 后自动重放。
   * @param data - G6 图数据（nodes / edges）
   */
  async function updateData(data: GraphData) {
    lastData = data
    if (!graph) return
    graph.setData(data)
    await graph.render()
  }

  function getInstance() {
    return graph
  }

  onMounted(() => {
    nextTick(initGraph)
  })
  onActivated(() => {
    nextTick(initGraph)
  })
  onDeactivated(() => {
    disposeGraph()
  })
  onUnmounted(() => {
    disposeGraph()
  })

  return { updateData, getInstance }
}
