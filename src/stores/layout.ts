import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { BreadcrumbItem } from '@/types/breadcrumb'

export const useLayoutStore = defineStore('layout', () => {
  const sidebarCollapsed = ref(false)
  const breadcrumbs = ref<BreadcrumbItem[]>([])
  const pageLoading = ref(false)

  /** 切换侧栏折叠状态 */
  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  /**
   * 手动设置整条面包屑（路由 afterEach 会自动调用）
   * 详情页加载完数据后可用 mergeLastBreadcrumb 替换最后一项为动态名称
   */
  function setBreadcrumbs(crumbs: BreadcrumbItem[]) {
    breadcrumbs.value = crumbs
  }

  /** 仅替换最后一级面包屑标题，常用于详情页展示项目名/任务名 */
  function mergeLastBreadcrumb(title: string) {
    if (breadcrumbs.value.length === 0) return
    breadcrumbs.value = [
      ...breadcrumbs.value.slice(0, -1),
      { title },
    ]
  }

  /** 控制主内容区路由切换时的全局 loading 遮罩 */
  function setPageLoading(loading: boolean) {
    pageLoading.value = loading
  }

  return {
    sidebarCollapsed,
    breadcrumbs,
    pageLoading,
    toggleSidebar,
    setBreadcrumbs,
    mergeLastBreadcrumb,
    setPageLoading,
  }
})
