import { onUnmounted, ref } from 'vue'

/**
 * Safe polling composable.
 * - Immediate first call on start()
 * - Auto-clears on component unmount
 * - Errors are swallowed (already handled by axios interceptor)
 *
 * @param fn      Async function to call on each tick
 * @param intervalMs  Polling interval in milliseconds (default 5000)
 */
export function usePolling(fn: () => Promise<void>, intervalMs = 5000) {
  let timer: ReturnType<typeof setInterval> | null = null
  const isPolling = ref(false)

  async function tick() {
    try {
      await fn()
    } catch {
      // errors already surfaced via axios interceptor message
    }
  }

  function start() {
    if (isPolling.value) return
    isPolling.value = true
    tick()
    timer = setInterval(tick, intervalMs)
  }

  function stop() {
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
    isPolling.value = false
  }

  onUnmounted(stop)

  return { isPolling, start, stop }
}
