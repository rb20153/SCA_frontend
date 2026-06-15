import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLayoutStore } from '@/stores/layout'
import { resolvePageBackTarget, shouldShowPageBack } from '@/utils/navigation'

/**
 * 顶栏「返回」按钮逻辑：是否展示、点击后按 from / history / 面包屑 回退
 */
export function usePageBack() {
  const route = useRoute()
  const router = useRouter()
  const layoutStore = useLayoutStore()

  const visible = computed(() => shouldShowPageBack(route, layoutStore.breadcrumbs))

  /** 执行返回：优先 from query，其次浏览器后退，再次面包屑上级 */
  function goBack() {
    const target = resolvePageBackTarget(route, layoutStore.breadcrumbs)
    if (target.mode === 'back') {
      router.back()
      return
    }
    if (target.path) {
      router.push(target.path)
    }
  }

  return { visible, goBack }
}
