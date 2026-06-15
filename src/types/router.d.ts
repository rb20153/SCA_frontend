import type { BreadcrumbItem } from './breadcrumb'

declare module 'vue-router' {
  interface RouteMeta {
    /** 页面标题，用于 document.title 与面包屑兜底 */
    title?: string
    /** 是否需要登录，默认 true */
    requiresAuth?: boolean
    /** 面包屑路径，对齐 prototype.html 的 crumbs 字段；未配置时仅用 title 兜底 */
    breadcrumbs?: BreadcrumbItem[]
    /** 是否强制显示/隐藏顶栏「返回」；未设置时按 from query 与面包屑层级推断 */
    showBack?: boolean
  }
}

export {}
