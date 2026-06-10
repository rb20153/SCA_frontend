/** 顶栏面包屑单项：有 path 时可点击跳转，最后一项通常不带 path */
export interface BreadcrumbItem {
  title: string
  path?: string
}
