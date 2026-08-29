import type { RolePagePermission, RolePermissionKey, RolePermissionMap } from '@/types/system'

export const BASE_PAGE_PERMISSION_PATHS = [
  '/dashboard',
  '/system/messages',
  '/system/profile',
] as const

export type BasePagePermissionPath = (typeof BASE_PAGE_PERMISSION_PATHS)[number]
export type PagePermissionPath = RolePermissionKey | BasePagePermissionPath
export type PagePermissionMap = Record<PagePermissionPath, RolePagePermission>
export type PermissionAccess = 'read' | 'write'

const EDITOR_ROUTE_PATTERNS = [
  /^\/policies\/[^/]+\/edit$/,
  /^\/reports\/templates\/[^/]+\/edit$/,
]

/** 将运行时路径映射为后端可配置的静态页面权限键。 */
export function resolvePermissionOwner(path: string): PagePermissionPath | undefined {
  if (BASE_PAGE_PERMISSION_PATHS.includes(path as BasePagePermissionPath)) {
    return path as BasePagePermissionPath
  }
  if (/^\/projects\/[^/]+$/.test(path)) return '/projects'
  if (/^\/detect\/autonomy\/[^/]+\/result$/.test(path)) return '/detect/autonomy'
  if (/^\/detect\/risk\/[^/]+$/.test(path)) return '/detect/risk'
  if (/^\/policies\/[^/]+\/(edit|governance|trace)$/.test(path)) return '/policies'
  if (/^\/reports\/templates\/[^/]+\/edit$/.test(path)) return '/reports/templates'
  if (path === '/knowledge/vulnerabilities/items') return '/knowledge/vulnerabilities'
  if (/^\/knowledge\/[^/]+\/(versions|directory)$/.test(path)) return '/knowledge'

  return path as RolePermissionKey
}

/** 纯编辑型子路由必须具备 write 权限，不能仅靠隐藏列表编辑入口保护。 */
export function isWriteProtectedRoute(path: string): boolean {
  return EDITOR_ROUTE_PATTERNS.some((pattern) => pattern.test(path))
}

/** 生成包含所有可配置页面与基础页的权限表。 */
export function createEmptyPagePermissionMap(): PagePermissionMap {
  const configurable = Object.fromEntries(
    (Object.keys(createEmptyRolePermissionMap()) as RolePermissionKey[]).map((key) => [
      key,
      { read: false, write: false },
    ]),
  ) as RolePermissionMap

  return {
    ...configurable,
    '/dashboard': { read: true, write: true },
    '/system/messages': { read: true, write: true },
    '/system/profile': { read: true, write: true },
  }
}

/** 角色权限类型的零值由页面权限模块复用，避免在 UI 组件中维护第二份页面清单。 */
function createEmptyRolePermissionMap(): RolePermissionMap {
  return {
    '/projects': { read: false, write: false },
    '/detect/autonomy': { read: false, write: false },
    '/detect/risk': { read: false, write: false },
    '/detect/ai-analysis': { read: false, write: false },
    '/policies': { read: false, write: false },
    '/reports': { read: false, write: false },
    '/reports/templates': { read: false, write: false },
    '/knowledge': { read: false, write: false },
    '/knowledge/coverage': { read: false, write: false },
    '/knowledge/vulnerabilities': { read: false, write: false },
    '/knowledge/quarter-updates': { read: false, write: false },
    '/system/users': { read: false, write: false },
    '/system/departments': { read: false, write: false },
    '/system/roles': { read: false, write: false },
    '/system/logs': { read: false, write: false },
    '/system/alerts': { read: false, write: false },
  }
}

/**
 * 兼容后端新旧 permission 格式：旧字符串数组表示该页面同时具备 read/write。
 * 非法 write:true/read:false 统一归一化为 read:true/write:true。
 */
export function normalizePagePermissions(raw: unknown): PagePermissionMap | undefined {
  if (raw === undefined || raw === null) return undefined

  const permissions = createEmptyPagePermissionMap()
  if (Array.isArray(raw)) {
    for (const item of raw) {
      const owner = resolvePermissionOwner(String(item ?? '').trim())
      if (owner && owner in permissions) {
        permissions[owner] = { read: true, write: true }
      }
    }
    return permissions
  }

  if (!raw || typeof raw !== 'object') return permissions
  const source = raw as Record<string, unknown>
  for (const key of Object.keys(permissions) as PagePermissionPath[]) {
    if (BASE_PAGE_PERMISSION_PATHS.includes(key as BasePagePermissionPath)) continue
    const value = source[key]
    if (!value || typeof value !== 'object') continue
    const entry = value as Record<string, unknown>
    const write = entry.write === true
    permissions[key] = { read: entry.read === true || write, write }
  }
  return permissions
}

export function canAccessPage(
  permissions: PagePermissionMap | undefined,
  path: string,
  access: PermissionAccess,
): boolean {
  const owner = resolvePermissionOwner(path)
  if (!owner) return false
  if (BASE_PAGE_PERMISSION_PATHS.includes(owner as BasePagePermissionPath)) return true
  return permissions?.[owner]?.[access] === true
}

export function findFirstReadablePath(permissions: PagePermissionMap | undefined): string {
  const orderedPaths: PagePermissionPath[] = [
    '/dashboard',
    '/projects',
    '/detect/autonomy',
    '/detect/risk',
    '/detect/ai-analysis',
    '/policies',
    '/reports',
    '/reports/templates',
    '/knowledge',
    '/knowledge/coverage',
    '/knowledge/vulnerabilities',
    '/knowledge/quarter-updates',
    '/system/users',
    '/system/departments',
    '/system/roles',
    '/system/logs',
    '/system/alerts',
    '/system/messages',
    '/system/profile',
  ]
  return orderedPaths.find((path) => canAccessPage(permissions, path, 'read')) ?? '/dashboard'
}
