import { computed } from 'vue'
import { useRoute, type RouteLocationRaw } from 'vue-router'
import { appendFromQuery } from '@/utils/navigation'

/**
 * 跨模块跳转时为 target 附加当前页 fullPath 作为 from query
 */
export function useRouteWithFrom() {
  const route = useRoute()

  const currentFullPath = computed(() => route.fullPath)

  /** 将目标路由包装为带 from 的跳转对象 */
  function withFrom(target: RouteLocationRaw): RouteLocationRaw {
    return appendFromQuery(target, route.fullPath)
  }

  return { currentFullPath, withFrom }
}
