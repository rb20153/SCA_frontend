import { onMounted, onUnmounted, type Ref } from 'vue'
import { Graph, type GraphOptions, type GraphData } from '@antv/g6'

/**
 * Encapsulates AntV G6 lifecycle: init → render → destroy.
 * Never call new Graph() directly in a component — always use this composable.
 */
export function useG6Graph(domRef: Ref<HTMLElement | null>, config: Omit<GraphOptions, 'container'>) {
  let graph: Graph | null = null

  onMounted(() => {
    if (!domRef.value) return
    graph = new Graph({ container: domRef.value, ...config })
    graph.render()
  })

  onUnmounted(() => {
    graph?.destroy()
    graph = null
  })

  function updateData(data: GraphData) {
    if (!graph) return
    graph.setData(data)
    graph.render()
  }

  function getInstance() {
    return graph
  }

  return { updateData, getInstance }
}
