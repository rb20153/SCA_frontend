import type { RolePermissionKey, RolePermissionMap } from '@/types/system'

/** 权限 Key 别名 */
export type PermissionKey = RolePermissionKey

export interface RolePermissionOption {
  key: PermissionKey
  label: string
  englishLabel: string
}

/** 角色抽屉可配置的静态页面（基础页由前端强制授予，无需配置）。 */
export const ROLE_PERMISSION_OPTIONS: RolePermissionOption[] = [
  { key: '/projects', label: '项目管理', englishLabel: 'Project Management' },
  { key: '/detect/autonomy', label: '自主率检测', englishLabel: 'Autonomy Detection' },
  { key: '/detect/risk', label: '开源风险检测', englishLabel: 'Open Source Risk Detection' },
  { key: '/detect/ai-analysis', label: 'AI 辅助分析', englishLabel: 'AI Assisted Analysis' },
  { key: '/policies', label: '策略列表', englishLabel: 'Policy List' },
  { key: '/reports', label: '报告列表', englishLabel: 'Report List' },
  { key: '/reports/templates', label: '报告模板', englishLabel: 'Report Templates' },
  { key: '/knowledge', label: '知识库管理', englishLabel: 'Knowledge Base Management' },
  { key: '/knowledge/coverage', label: '覆盖统计', englishLabel: 'Coverage Statistics' },
  { key: '/knowledge/vulnerabilities', label: '漏洞知识库', englishLabel: 'Vulnerability Knowledge Base' },
  { key: '/knowledge/quarter-updates', label: '季度更新管理', englishLabel: 'Quarterly Update Management' },
  { key: '/system/users', label: '用户列表', englishLabel: 'User Management' },
  { key: '/system/departments', label: '部门管理', englishLabel: 'Department Management' },
  { key: '/system/roles', label: '角色管理', englishLabel: 'Role Management' },
  { key: '/system/logs', label: '日志列表', englishLabel: 'Audit Log' },
  { key: '/system/alerts', label: '告警中心', englishLabel: 'Alert Center' },
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

/** 生成全无权限的页面权限表。 */
export function createEmptyRolePermissions(): RolePermissionMap {
  return Object.fromEntries(
    ALL_PERMISSION_KEYS.map((key) => [key, { read: false, write: false }]),
  ) as RolePermissionMap
}

/** 深拷贝权限表并补齐缺失键，同时强制 write 必须包含 read。 */
export function cloneRolePermissions(source: Partial<RolePermissionMap>): RolePermissionMap {
  const empty = createEmptyRolePermissions()
  for (const key of ALL_PERMISSION_KEYS) {
    const item = source[key]
    const write = item?.write === true
    empty[key] = { read: item?.read === true || write, write }
  }
  return empty
}

/** 新建角色默认不授予业务页面权限。 */
export function createDefaultCustomRolePermissions(): RolePermissionMap {
  return createEmptyRolePermissions()
}
