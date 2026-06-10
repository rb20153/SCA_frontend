import { onMounted, onUnmounted, type Ref } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'

/**
 * Encapsulates ECharts lifecycle: init → ResizeObserver → dispose.
 * Never call echarts.init directly in a component — always use this composable.
 */
export function useECharts(domRef: Ref<HTMLElement | null>) {
  let chart: echarts.ECharts | null = null
  let resizeObserver: ResizeObserver | null = null

  function setOption(option: EChartsOption, notMerge = false) {
    chart?.setOption(option, { notMerge })
  }

  function resize() {
    chart?.resize()
  }

  function getInstance() {
    return chart
  }

  onMounted(() => {
    if (!domRef.value) return
    chart = echarts.init(domRef.value)

    resizeObserver = new ResizeObserver(() => {
      chart?.resize()
    })
    resizeObserver.observe(domRef.value)
  })

  onUnmounted(() => {
    resizeObserver?.disconnect()
    resizeObserver = null
    chart?.dispose()
    chart = null
  })

  return { setOption, resize, getInstance }
}
