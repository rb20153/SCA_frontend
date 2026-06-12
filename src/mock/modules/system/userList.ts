import type {
  DepartmentOption,
  RoleOption,
  SystemUser,
  UserQueryParams,
  UserRecord,
} from '@/types/user'
import { getMockOwnedProjectCount } from '@/mock/modules/system/userProjects'
import { MOCK_REGISTERED_USERNAMES } from '@/mock/modules/auth/users'
import { MOCK_ALL_DEPARTMENTS } from '@/mock/modules/system/departmentList'
import { MOCK_ALL_ROLES } from '@/mock/modules/system/roleList'

interface UserSeed extends UserRecord {
  password: string
}

const USER_SEEDS: UserSeed[] = [
  {
    userId: 'user-001',
    username: 'admin',
    realName: '管理员',
    departmentId: 'dept-001',
    departmentName: '检测中心',
    roleId: 'role-001',
    roleName: '管理员',
    phone: '13800000001',
    status: 'enabled',
    createdAt: '2026-01-05T09:00:00+08:00',
    lastLoginAt: '2026-06-11T18:30:00+08:00',
    password: 'Admin123',
  },
  {
    userId: 'user-002',
    username: 'zhangsan',
    realName: '张三',
    departmentId: 'dept-002',
    departmentName: '仿真研发部',
    roleId: 'role-003',
    roleName: '检测工程师',
    phone: '13800000002',
    status: 'enabled',
    createdAt: '2026-01-08T10:15:00+08:00',
    lastLoginAt: '2026-06-10T14:22:00+08:00',
    password: 'Pass1234',
  },
  {
    userId: 'user-003',
    username: 'lisi',
    realName: '李四',
    departmentId: 'dept-005',
    departmentName: '合规部',
    roleId: 'role-002',
    roleName: '审计员',
    phone: '13800000003',
    status: 'enabled',
    createdAt: '2026-01-10T11:20:00+08:00',
    lastLoginAt: '2026-06-09T09:05:00+08:00',
    password: 'Pass1234',
  },
  {
    userId: 'user-004',
    username: 'wangwu',
    realName: '王五',
    departmentId: 'dept-007',
    departmentName: '业务部',
    roleId: 'role-004',
    roleName: '只读',
    phone: '13800000004',
    status: 'enabled',
    createdAt: '2026-01-12T08:40:00+08:00',
    lastLoginAt: null,
    password: 'Pass1234',
  },
  {
    userId: 'user-005',
    username: 'zhaoliu',
    realName: '赵六',
    departmentId: 'dept-003',
    departmentName: '研发一部',
    roleId: 'role-003',
    roleName: '检测工程师',
    phone: '13900000005',
    status: 'enabled',
    createdAt: '2026-02-01T13:00:00+08:00',
    lastLoginAt: '2026-06-08T16:18:00+08:00',
    password: 'Pass1234',
  },
  {
    userId: 'user-006',
    username: 'sunqi',
    realName: '孙七',
    departmentId: 'dept-004',
    departmentName: '研发二部',
    roleId: 'role-005',
    roleName: '项目协作者',
    phone: '13700000006',
    status: 'disabled',
    createdAt: '2026-02-15T15:30:00+08:00',
    lastLoginAt: '2026-05-20T10:00:00+08:00',
    password: 'Pass1234',
  },
  {
    userId: 'user-007',
    username: 'zhouba',
    realName: '周八',
    departmentId: 'dept-006',
    departmentName: '测试部',
    roleId: 'role-004',
    roleName: '只读',
    phone: '13600000007',
    status: 'disabled',
    createdAt: '2026-03-01T09:45:00+08:00',
    lastLoginAt: null,
    password: 'Pass1234',
  },
  {
    userId: 'user-008',
    username: 'wujiu',
    realName: '吴九',
    departmentId: 'dept-008',
    departmentName: '气动室',
    roleId: 'role-003',
    roleName: '检测工程师',
    phone: '13500000008',
    status: 'enabled',
    createdAt: '2026-03-18T16:10:00+08:00',
    lastLoginAt: '2026-06-07T11:33:00+08:00',
    password: 'Pass1234',
  },
  {
    userId: 'user-009',
    username: 'zhengshi',
    realName: '郑十',
    departmentId: 'dept-009',
    departmentName: '航天部',
    roleId: 'role-004',
    roleName: '只读',
    phone: '13400000009',
    status: 'enabled',
    createdAt: '2026-04-02T10:00:00+08:00',
    lastLoginAt: '2026-06-06T08:50:00+08:00',
    password: 'Pass1234',
  },
  {
    userId: 'user-010',
    username: 'chenyi',
    realName: '陈一',
    departmentId: 'dept-010',
    departmentName: '质量保障组',
    roleId: 'role-002',
    roleName: '审计员',
    phone: '13300000010',
    status: 'enabled',
    createdAt: '2026-04-20T14:25:00+08:00',
    lastLoginAt: '2026-06-05T17:40:00+08:00',
    password: 'Pass1234',
  },
  {
    userId: 'user-011',
    username: 'liner',
    realName: '林二',
    departmentId: 'dept-002',
    departmentName: '仿真研发部',
    roleId: 'role-005',
    roleName: '项目协作者',
    phone: '13200000011',
    status: 'enabled',
    createdAt: '2026-05-08T11:15:00+08:00',
    lastLoginAt: '2026-06-04T13:12:00+08:00',
    password: 'Pass1234',
  },
  {
    userId: 'user-012',
    username: 'huangsan',
    realName: '黄三',
    departmentId: 'dept-001',
    departmentName: '检测中心',
    roleId: 'role-004',
    roleName: '只读',
    phone: '13100000012',
    status: 'enabled',
    createdAt: '2026-05-25T09:30:00+08:00',
    lastLoginAt: null,
    password: 'Pass1234',
  },
]

/** 运行时可变用户列表（不含密码、不含负责项目数） */
export const MOCK_ALL_USERS: UserRecord[] = USER_SEEDS.map(
  ({ password: _password, ...user }) => ({ ...user }),
)

/** mock 用户密码表（仅创建/登录校验用，不返回列表） */
export const MOCK_USER_PASSWORDS: Record<string, string> = Object.fromEntries(
  USER_SEEDS.map((item) => [item.userId, item.password]),
)

let nextUserSeq = USER_SEEDS.length + 1

/** 生成新用户 ID */
export function createMockUserId(): string {
  const id = `user-${String(nextUserSeq).padStart(3, '0')}`
  nextUserSeq += 1
  return id
}

/** 用户名是否已占用 */
export function isMockUsernameTaken(username: string, excludeUserId?: string): boolean {
  const normalized = username.trim().toLowerCase()
  const existsInUsers = MOCK_ALL_USERS.some(
    (item) =>
      item.userId !== excludeUserId && item.username.toLowerCase() === normalized,
  )
  if (existsInUsers) {
    return true
  }
  if (!excludeUserId) {
    return MOCK_REGISTERED_USERNAMES.some((item) => item.toLowerCase() === normalized)
  }
  return false
}

/** 注册用户名到全局列表（与登录注册共用） */
export function registerMockUsername(username: string): void {
  const normalized = username.trim().toLowerCase()
  if (!MOCK_REGISTERED_USERNAMES.map((item) => item.toLowerCase()).includes(normalized)) {
    MOCK_REGISTERED_USERNAMES.push(username.trim())
  }
}

/**
 * 获取启用状态的部门下拉选项
 */
export function getMockEnabledDepartmentOptions(): DepartmentOption[] {
  return MOCK_ALL_DEPARTMENTS.filter((item) => item.status === 'enabled')
    .map((item) => ({
      departmentId: item.departmentId,
      departmentName: item.departmentName,
    }))
    .sort((a, b) => a.departmentName.localeCompare(b.departmentName, 'zh-CN'))
}

/**
 * 获取启用状态的系统角色下拉选项
 */
export function getMockEnabledRoleOptions(): RoleOption[] {
  return MOCK_ALL_ROLES.filter((item) => item.status === 'enabled')
    .map((item) => ({
      roleId: item.roleId,
      roleName: item.roleName,
    }))
    .sort((a, b) => a.roleName.localeCompare(b.roleName, 'zh-CN'))
}

/**
 * 获取筛选区系统角色下拉（含全部角色，不论状态）
 */
export function getMockRoleFilterOptions(): RoleOption[] {
  return MOCK_ALL_ROLES.map((item) => ({
    roleId: item.roleId,
    roleName: item.roleName,
  })).sort((a, b) => a.roleName.localeCompare(b.roleName, 'zh-CN'))
}

/**
 * 按查询条件过滤并排序用户列表（按创建时间倒序）
 * @param params - 姓名、角色、部门、创建时间筛选
 */
export function filterMockUserList(params: UserQueryParams): SystemUser[] {
  let list = [...MOCK_ALL_USERS]

  const realName = params.realName?.trim()
  if (realName) {
    list = list.filter((item) => item.realName.includes(realName))
  }

  if (params.roleId) {
    list = list.filter((item) => item.roleId === params.roleId)
  }

  const departmentName = params.departmentName?.trim()
  if (departmentName) {
    list = list.filter((item) => item.departmentName.includes(departmentName))
  }

  if (params.createdAtStart && params.createdAtEnd) {
    const start = new Date(params.createdAtStart).getTime()
    const end = new Date(params.createdAtEnd).getTime()
    list = list.filter((item) => {
      const created = new Date(item.createdAt).getTime()
      return created >= start && created <= end
    })
  }

  return list
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((item) => ({
      ...item,
      ownedProjectCount: getMockOwnedProjectCount(item.userId),
    }))
}
