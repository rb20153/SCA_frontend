import type { RolePermissionKey, RolePermissionMap } from '@/types/system'

/** 权限 Key 别名（mock 模块内使用） */
export type PermissionKey = RolePermissionKey

export interface RolePermissionOption {
  key: PermissionKey
  label: string
}

/** 角色抽屉可配置的权限项（与后端一致） */
export const ROLE_PERMISSION_OPTIONS: RolePermissionOption[] = [
  { key: 'menu.home', label: '预览权限' },
  { key: 'project.read', label: '项目读取' },
  { key: 'op.task_run', label: '创建/运行任务' },
  { key: 'report.read', label: '报告读取' },
]

/** @deprecated 兼容旧引用，请使用 ROLE_PERMISSION_OPTIONS */
export const PERMISSION_TREE_GROUPS = [
  {
    key: 'role',
    title: '授权',
    children: ROLE_PERMISSION_OPTIONS,
  },
]

/** 全部权限 Key 列表 */
export const ALL_PERMISSION_KEYS: PermissionKey[] = ROLE_PERMISSION_OPTIONS.map(
  (item) => item.key,
)

/** 内置角色权限（mock 参考；联调时以后端返回为准） */
export const BUILTIN_ROLE_PERMISSIONS: Record<string, RolePermissionMap> = {
  admin: {
    'menu.home': true,
    'project.read': true,
    'op.task_run': true,
    'report.read': true,
  },
  auditor: {
    'menu.home': true,
    'project.read': true,
    'op.task_run': false,
    'report.read': true,
  },
  engineer: {
    'menu.home': true,
    'project.read': true,
    'op.task_run': true,
    'report.read': true,
  },
  readonly: {
    'menu.home': true,
    'project.read': true,
    'op.task_run': false,
    'report.read': true,
  },
}

/** 生成全 false 权限表 */
export function createEmptyRolePermissions(): RolePermissionMap {
  return Object.fromEntries(
    ALL_PERMISSION_KEYS.map((key) => [key, false]),
  ) as RolePermissionMap
}

/** 深拷贝权限表，并补齐缺失 Key；兼容后端 `*: true` 通配 */
export function cloneRolePermissions(source: Partial<RolePermissionMap> & Record<string, boolean>): RolePermissionMap {
  if (source['*'] === true) {
    return Object.fromEntries(
      ALL_PERMISSION_KEYS.map((key) => [key, true]),
    ) as RolePermissionMap
  }

  const empty = createEmptyRolePermissions()
  for (const key of ALL_PERMISSION_KEYS) {
    if (key in source) {
      empty[key] = Boolean(source[key])
    }
  }
  return empty
}

/** 新建自定义角色默认权限：与只读角色一致 */
export function createDefaultCustomRolePermissions(): RolePermissionMap {
  return cloneRolePermissions(BUILTIN_ROLE_PERMISSIONS.readonly)
}

/**
 * 内置只读角色：未勾选的权限项不可再勾选
 * @param roleCode - 内置角色编码
 * @param permissionKey - 权限 Key
 * @param checked - 当前是否勾选
 */
export function isBuiltinPermissionDisabled(
  roleCode: string,
  permissionKey: RolePermissionKey,
  checked: boolean,
): boolean {
  return roleCode === 'readonly' && !checked
}
