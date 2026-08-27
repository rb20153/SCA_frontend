import type {
  HistoryState,
  RouteLocationRaw,
  RouteLocationNormalizedLoaded,
} from 'vue-router'
import type { BreadcrumbItem } from '@/types/breadcrumb'

/** 跨模块跳转时携带的来源页 query 键名 */
export const FROM_QUERY_KEY = 'from'

/**
 * Convert domain models into the serializable value shape accepted by
 * history.state. Unsupported values are omitted instead of reaching the
 * browser History API and causing a DataCloneError.
 */
type HistoryStateEntry = HistoryState[string]

function toHistoryStateValue(value: unknown): HistoryStateEntry {
  if (
    value === null ||
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value
  }

  if (Array.isArray(value)) {
    return value.map(toHistoryStateValue)
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (typeof value === 'object') {
    const state: HistoryState = {}
    for (const [key, entry] of Object.entries(value)) {
      if (typeof entry !== 'function' && typeof entry !== 'symbol') {
        state[key] = toHistoryStateValue(entry)
      }
    }
    return state
  }

  return undefined
}

/** Build a browser-safe history state object from application models. */
export function createNavigationState(entries: Record<string, unknown>): HistoryState {
  return toHistoryStateValue(entries) as HistoryState
}

/**
 * 校验 from 是否为站内相对路径，防止开放重定向
 * @param path - 待跳转路径
 */
export function isSafeInternalPath(path: string): boolean {
  if (!path.startsWith('/') || path.startsWith('//')) {
    return false
  }
  return !path.startsWith('/login')
}

/**
 * 为目标路由附加 from 来源（用于顶栏「返回」回到跳转前页面）
 * @param target - 目标路由
 * @param from - 来源页 fullPath，通常为 `route.fullPath`
 */
export function appendFromQuery(target: RouteLocationRaw, from: string): RouteLocationRaw {
  if (!isSafeInternalPath(from)) {
    return target
  }

  if (typeof target === 'string') {
    return { path: target, query: { [FROM_QUERY_KEY]: from } }
  }

  return {
    ...target,
    query: {
      ...(typeof target.query === 'object' && target.query !== null ? target.query : {}),
      [FROM_QUERY_KEY]: from,
    },
  }
}

/**
 * 从面包屑中取最近一级可点击的上级 path（用于返回兜底）
 * @param breadcrumbs - 当前顶栏面包屑
 */
export function getBreadcrumbFallbackPath(breadcrumbs: BreadcrumbItem[]): string | null {
  for (let i = breadcrumbs.length - 2; i >= 0; i -= 1) {
    const crumb = breadcrumbs[i]
    if (crumb?.path) {
      return crumb.path
    }
  }
  return null
}

/**
 * 是否显示顶栏「返回」按钮
 * - 显式 meta.showBack
 * - 或带有 from 来源（跨模块跳入）
 * - 或面包屑层级 ≥ 3（详情/子页）
 */
export function shouldShowPageBack(
  route: RouteLocationNormalizedLoaded,
  breadcrumbs: BreadcrumbItem[],
): boolean {
  if (route.meta.showBack === false) {
    return false
  }
  if (route.meta.showBack === true) {
    return true
  }
  const from = route.query[FROM_QUERY_KEY]
  if (typeof from === 'string' && isSafeInternalPath(from)) {
    return true
  }
  return breadcrumbs.length >= 3
}

/**
 * 解析顶栏「返回」目标路径
 * 优先级：query.from → history.back → 面包屑上级 → 首页
 */
export function resolvePageBackTarget(
  route: RouteLocationNormalizedLoaded,
  breadcrumbs: BreadcrumbItem[],
): { mode: 'push' | 'back'; path?: string } {
  const from = route.query[FROM_QUERY_KEY]
  if (typeof from === 'string' && isSafeInternalPath(from)) {
    return { mode: 'push', path: from }
  }

  if (typeof window !== 'undefined' && window.history.length > 1) {
    return { mode: 'back' }
  }

  const fallback = getBreadcrumbFallbackPath(breadcrumbs)
  if (fallback) {
    return { mode: 'push', path: fallback }
  }

  return { mode: 'push', path: '/dashboard' }
}
