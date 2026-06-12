import type { Department, DepartmentQueryParams, DepartmentRecord } from '@/types/system'

interface DepartmentSeed {
  departmentId: string
  departmentName: string
  status: Department['status']
  remark: string
  createdAt: string
  /** mock 用：该部门下绑定用户数，删除前校验 */
  memberCount: number
}

const DEPARTMENT_SEEDS: DepartmentSeed[] = [
  {
    departmentId: 'dept-001',
    departmentName: '检测中心',
    status: 'enabled',
    remark: '平台运营与检测业务总部',
    createdAt: '2026-01-01T00:00:00+08:00',
    memberCount: 2,
  },
  {
    departmentId: 'dept-002',
    departmentName: '仿真研发部',
    status: 'enabled',
    remark: '飞控/结构仿真项目主责部门',
    createdAt: '2026-01-02T09:00:00+08:00',
    memberCount: 3,
  },
  {
    departmentId: 'dept-003',
    departmentName: '研发一部',
    status: 'enabled',
    remark: '',
    createdAt: '2026-01-02T09:30:00+08:00',
    memberCount: 0,
  },
  {
    departmentId: 'dept-004',
    departmentName: '研发二部',
    status: 'enabled',
    remark: '',
    createdAt: '2026-01-02T10:00:00+08:00',
    memberCount: 1,
  },
  {
    departmentId: 'dept-005',
    departmentName: '合规部',
    status: 'enabled',
    remark: '审计员主要归属',
    createdAt: '2026-01-03T11:00:00+08:00',
    memberCount: 1,
  },
  {
    departmentId: 'dept-006',
    departmentName: '测试部',
    status: 'disabled',
    remark: '暂停使用（演示）',
    createdAt: '2026-01-03T11:30:00+08:00',
    memberCount: 0,
  },
  {
    departmentId: 'dept-007',
    departmentName: '业务部',
    status: 'enabled',
    remark: '',
    createdAt: '2026-01-03T12:00:00+08:00',
    memberCount: 1,
  },
  {
    departmentId: 'dept-008',
    departmentName: '气动室',
    status: 'enabled',
    remark: '',
    createdAt: '2026-01-05T08:00:00+08:00',
    memberCount: 0,
  },
  {
    departmentId: 'dept-009',
    departmentName: '航天部',
    status: 'enabled',
    remark: '',
    createdAt: '2026-01-06T10:00:00+08:00',
    memberCount: 0,
  },
  {
    departmentId: 'dept-010',
    departmentName: '质量保障组',
    status: 'enabled',
    remark: '质量与验收支持',
    createdAt: '2026-01-08T14:20:00+08:00',
    memberCount: 0,
  },
  {
    departmentId: 'dept-011',
    departmentName: '运维保障组',
    status: 'disabled',
    remark: '',
    createdAt: '2026-01-10T09:00:00+08:00',
    memberCount: 0,
  },
]

/** 运行时可变部门列表（mock CRUD，不含 memberCount） */
export const MOCK_ALL_DEPARTMENTS: DepartmentRecord[] = DEPARTMENT_SEEDS.map(
  ({ memberCount: _memberCount, ...dept }) => ({ ...dept }),
)

/** 部门成员数（删除前校验用，与 MOCK_ALL_DEPARTMENTS 分离存储） */
export const MOCK_DEPARTMENT_MEMBER_COUNTS: Record<string, number> = Object.fromEntries(
  DEPARTMENT_SEEDS.map((item) => [item.departmentId, item.memberCount]),
)

let nextDepartmentSeq = DEPARTMENT_SEEDS.length + 1

/** 生成新部门 ID */
export function createMockDepartmentId(): string {
  const id = `dept-${String(nextDepartmentSeq).padStart(3, '0')}`
  nextDepartmentSeq += 1
  return id
}

/**
 * 按查询条件过滤并排序部门列表（平级，按创建时间倒序）
 * @param params - 部门名称、状态筛选
 */
export function filterMockDepartmentList(params: DepartmentQueryParams): Department[] {
  let list = [...MOCK_ALL_DEPARTMENTS]

  const departmentName = params.departmentName?.trim()
  if (departmentName) {
    list = list.filter((item) => item.departmentName.includes(departmentName))
  }

  if (params.status) {
    list = list.filter((item) => item.status === params.status)
  }

  return list
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((item) => ({
      ...item,
      memberCount: getMockDepartmentMemberCount(item.departmentId),
    }))
}

/**
 * 查询部门下是否仍有绑定用户（mock）
 * @param departmentId - 部门 ID
 */
export function getMockDepartmentMemberCount(departmentId: string): number {
  return MOCK_DEPARTMENT_MEMBER_COUNTS[departmentId] ?? 0
}
