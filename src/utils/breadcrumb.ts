import type { RouteLocationNormalizedLoaded } from 'vue-router'
import type { BreadcrumbItem } from '@/types/breadcrumb'

type CrumbInput = string | { title: string; path?: string }

/**
 * 声明式构造面包屑数组
 * - 最后一项自动视为当前页，不带 path
 * - 中间项可传 path 以支持点击回退到列表页等
 */
export function crumbs(...items: CrumbInput[]): BreadcrumbItem[] {
  return items.map((item, index) => {
    const title = typeof item === 'string' ? item : item.title
    const path = typeof item === 'string' ? undefined : item.path
    const isLast = index === items.length - 1
    return { title, path: isLast ? undefined : path }
  })
}

/**
 * 从当前路由 meta 解析面包屑
 * 优先使用 meta.breadcrumbs；否则用 meta.title 生成单级面包屑
 */
export function resolveBreadcrumbs(route: RouteLocationNormalizedLoaded): BreadcrumbItem[] {
  const { breadcrumbs, title } = route.meta

  if (Array.isArray(breadcrumbs) && breadcrumbs.length > 0) {
    return breadcrumbs
  }

  if (title) {
    return [{ title: String(title) }]
  }

  return []
}
