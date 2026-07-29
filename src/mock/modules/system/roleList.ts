import type { Role, RoleQueryParams, RoleRecord } from '@/types/system'
import {
  BUILTIN_ROLE_PERMISSIONS,
  cloneRolePermissions,
  createDefaultCustomRolePermissions,
} from '@/mock/modules/system/rolePermissionDefs'

interface RoleSeed extends RoleRecord {
  boundUserCount: number
}

const ROLE_SEEDS: RoleSeed[] = [
  {
    roleId: 'role-001',
    roleName: '管理员',
    roleCode: 'admin',
    status: 'enabled',
    remark: '拥有全部菜单与操作权限，可管理用户、角色、部门及全部业务模块。',
    isBuiltin: true,
    permissions: cloneRolePermissions(BUILTIN_ROLE_PERMISSIONS.admin),
    createdAt: '2026-01-01T08:00:00+08:00',
    boundUserCount: 1,
  },
  {
    roleId: 'role-002',
    roleName: '审计员',
    roleCode: 'auditor',
    status: 'enabled',
    remark: '侧重审计与治理：可审批策略、导出日志与报告、处理告警。',
    isBuiltin: true,
    permissions: cloneRolePermissions(BUILTIN_ROLE_PERMISSIONS.auditor),
    createdAt: '2026-01-01T08:30:00+08:00',
    boundUserCount: 2,
  },
  {
    roleId: 'role-003',
    roleName: '检测工程师',
    roleCode: 'engineer',
    status: 'enabled',
    remark: '检测执行角色：可维护项目、成员与交付物、运行检测、生成报告。',
    isBuiltin: true,
    permissions: cloneRolePermissions(BUILTIN_ROLE_PERMISSIONS.engineer),
    createdAt: '2026-01-01T09:00:00+08:00',
    boundUserCount: 5,
  },
  {
    roleId: 'role-004',
    roleName: '只读',
    roleCode: 'readonly',
    status: 'enabled',
    remark: '只读访问：可查看首页、项目、检测与风险结果及报告列表。',
    isBuiltin: true,
    permissions: cloneRolePermissions(BUILTIN_ROLE_PERMISSIONS.readonly),
    createdAt: '2026-01-01T09:30:00+08:00',
    boundUserCount: 3,
  },
  {
    roleId: 'role-005',
    roleName: '项目协作者',
    roleCode: 'project_collab',
    status: 'enabled',
    remark: '在只读基础上增加项目写入与交付物权限（自定义角色示例）。',
    isBuiltin: false,
    permissions: {
      ...createDefaultCustomRolePermissions(),
      'project.read': true,
      'op.task_run': true,
    },
    createdAt: '2026-02-10T14:00:00+08:00',
    boundUserCount: 0,
  },
  {
    roleId: 'role-006',
    roleName: '质量观察员',
    roleCode: 'qa_viewer',
    status: 'disabled',
    remark: '质量团队观察账号，当前停用。',
    isBuiltin: false,
    permissions: createDefaultCustomRolePermissions(),
    createdAt: '2026-03-05T10:20:00+08:00',
    boundUserCount: 2,
  },
]

/** 运行时可变角色列表（mock CRUD，不含 boundUserCount） */
export const MOCK_ALL_ROLES: RoleRecord[] = ROLE_SEEDS.map(
  ({ boundUserCount: _boundUserCount, ...role }) => ({ ...role }),
)

/** 角色绑定用户数（列表展示与删除校验） */
export const MOCK_ROLE_USER_COUNTS: Record<string, number> = Object.fromEntries(
  ROLE_SEEDS.map((item) => [item.roleId, item.boundUserCount]),
)

let nextRoleSeq = ROLE_SEEDS.length + 1

/** 生成新角色 ID */
export function createMockRoleId(): string {
  const id = `role-${String(nextRoleSeq).padStart(3, '0')}`
  nextRoleSeq += 1
  return id
}

/** 查询角色绑定用户数 */
export function getMockRoleUserCount(roleId: string): number {
  return MOCK_ROLE_USER_COUNTS[roleId] ?? 0
}

/** 角色编码是否已存在（更新时排除自身） */
export function isMockRoleCodeTaken(roleCode: string, excludeRoleId?: string): boolean {
  const normalized = roleCode.trim().toLowerCase()
  return MOCK_ALL_ROLES.some(
    (item) =>
      item.roleId !== excludeRoleId && item.roleCode.toLowerCase() === normalized,
  )
}

/**
 * 按查询条件过滤并排序角色列表（按创建时间倒序）
 * @param params - 角色名称、状态筛选
 */
export function filterMockRoleList(params: RoleQueryParams): Role[] {
  let list = [...MOCK_ALL_ROLES]

  const roleName = params.roleName?.trim()
  if (roleName) {
    list = list.filter((item) => item.roleName.includes(roleName))
  }

  if (params.status) {
    list = list.filter((item) => item.status === params.status)
  }

  return list
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((item) => ({
      ...item,
      boundUserCount: getMockRoleUserCount(item.roleId),
    }))
}
