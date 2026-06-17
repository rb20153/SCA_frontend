import { nextTick, onActivated, onDeactivated, onMounted, onUnmounted, type Ref } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'

/**
 * Encapsulates ECharts lifecycle: init → ResizeObserver → dispose.
 * Never call echarts.init directly in a component — always use this composable.
 */
export function useECharts(domRef: Ref<HTMLElement | null>) {
  let chart: echarts.ECharts | null = null
  let resizeObserver: ResizeObserver | null = null
  let lastOption: EChartsOption | null = null
  // 当前实例自 init 以来是否已经渲染过首帧：首帧放进场动画，后续走合并更新
  let hasRenderedSinceInit = false
  let animationFrameId: number | null = null

  /** 取消还没执行的 setOption，避免组件离开页面后继续写入已销毁实例 */
  function cancelPendingRender() {
    if (animationFrameId === null) return
    window.cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }

  /**
   * 在浏览器下一帧写入 option：
   * - 实例首帧用 notMerge 播放从 0 开始的进场动画
   * - 后续更新用 replaceMerge 替换 series，复用 ECharts 内置补间动画做平滑过渡，
   *   既避免每次重放进场导致闪烁，又能清掉数量变化后残留的旧 series
   */
  function renderOption(option: EChartsOption) {
    if (!chart) return
    cancelPendingRender()
    animationFrameId = window.requestAnimationFrame(() => {
      if (!chart) return
      if (hasRenderedSinceInit) {
        chart.setOption(option, { notMerge: false, replaceMerge: ['series'], lazyUpdate: false })
      } else {
        chart.setOption(option, { notMerge: true, lazyUpdate: false })
        hasRenderedSinceInit = true
      }
      animationFrameId = null
    })
  }

  /** 初始化图表实例，并重放最近一次 option，保证切回页面时重新播放进场动画 */
  function initChart() {
    if (chart || !domRef.value) return
    chart = echarts.init(domRef.value)
    hasRenderedSinceInit = false

    resizeObserver = new ResizeObserver(() => {
      chart?.resize()
    })
    resizeObserver.observe(domRef.value)

    if (lastOption) {
      renderOption(lastOption)
    }
  }

  /** 销毁图表实例，释放 ResizeObserver 和 ECharts 内部资源 */
  function disposeChart() {
    cancelPendingRender()
    resizeObserver?.disconnect()
    resizeObserver = null
    chart?.dispose()
    chart = null
    hasRenderedSinceInit = false
  }

  /**
   * 设置图表配置；如果实例尚未初始化，会先缓存 option，待 init 后自动重放。
   * 首帧播放进场动画，后续调用自动走合并更新，无需调用方关心 notMerge。
   * @param option - ECharts 配置
   */
  function setOption(option: EChartsOption) {
    lastOption = option
    renderOption(option)
  }

  /** 手动触发图表尺寸重算 */
  function resize() {
    chart?.resize()
  }

  /** 获取底层 ECharts 实例，供特殊图表调试或扩展 */
  function getInstance() {
    return chart
  }

  onMounted(() => {
    nextTick(initChart)
  })

  onActivated(() => {
    nextTick(initChart)
  })

  onDeactivated(() => {
    disposeChart()
  })

  onUnmounted(() => {
    disposeChart()
  })

  return { setOption, resize, getInstance }
}
