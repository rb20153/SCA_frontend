import type { Project, ProjectStatus } from '@/types/project'
import { MOCK_ALL_DEPARTMENTS } from '@/mock/modules/system/departmentList'
import {
  MOCK_ALL_USERS,
  findMockEnabledUserByRealName,
} from '@/mock/modules/system/userList'

interface ProjectSeed {
  projectName: string
  description: string
  owner: string
  department: string
  status: ProjectStatus
  taskCount: number
  lastScanAt: string | null
  createdAt: string
}

const PROJECT_SEEDS: ProjectSeed[] = [
  {
    projectName: '飞控仿真V2',
    description: '动力学仿真飞控模块自主率检测，覆盖主控律、传感器融合与仿真接口层代码。',
    owner: '张三',
    department: '仿真研发部',
    status: 'in_progress',
    taskCount: 6,
    lastScanAt: '2026-05-18T14:00:00+08:00',
    createdAt: '2026-05-01T10:25:00+08:00',
  },
  {
    projectName: '结构分析平台',
    description: '结构力学仿真与开源组件分析，含网格划分、求解器与后处理链路。',
    owner: '李四',
    department: '合规部',
    status: 'completed',
    taskCount: 3,
    lastScanAt: '2026-05-10T09:30:00+08:00',
    createdAt: '2026-04-20T16:40:00+08:00',
  },
  {
    projectName: '柔性机构仿真链路',
    description: '柔性机构多体动力学仿真，关注约束求解与接触算法模块自主率。',
    owner: '王五',
    department: '业务部',
    status: 'failed',
    taskCount: 2,
    lastScanAt: '2026-05-26T21:15:00+08:00',
    createdAt: '2026-05-12T08:10:00+08:00',
  },
  {
    projectName: '控制验证系统',
    description: '飞控律验证与回归测试，集成 HIL 仿真与自动化用例管理。',
    owner: '赵六',
    department: '研发一部',
    status: 'in_progress',
    taskCount: 4,
    lastScanAt: '2026-05-22T11:20:00+08:00',
    createdAt: '2026-05-08T14:00:00+08:00',
  },
  {
    projectName: '仿真工具链',
    description: '仿真前后处理工具集成，统一脚本化批处理与结果归档流程。',
    owner: '林二',
    department: '仿真研发部',
    status: 'completed',
    taskCount: 5,
    lastScanAt: '2026-05-15T16:45:00+08:00',
    createdAt: '2026-04-28T09:15:00+08:00',
  },
  {
    projectName: '气动热仿真库',
    description: '气动加热与热防护分析，覆盖对流换热与辐射模型实现。',
    owner: '吴九',
    department: '气动室',
    status: 'in_progress',
    taskCount: 1,
    lastScanAt: null,
    createdAt: '2026-05-20T13:30:00+08:00',
  },
  {
    projectName: '轨道动力学平台',
    description: '卫星轨道仿真与自主率评估，含摄动力模型与姿态耦合模块。',
    owner: '郑十',
    department: '航天部',
    status: 'completed',
    taskCount: 7,
    lastScanAt: '2026-05-05T10:00:00+08:00',
    createdAt: '2026-04-15T11:00:00+08:00',
  },
  {
    projectName: '多物理场耦合引擎',
    description: '流固热耦合仿真核心库，重点审查耦合迭代与数据交换层代码。',
    owner: '陈一',
    department: '研发二部',
    status: 'failed',
    taskCount: 2,
    lastScanAt: '2026-05-24T18:30:00+08:00',
    createdAt: '2026-05-14T15:20:00+08:00',
  },
]

const MOCK_PROJECT_TOTAL = 28

/** 按部门名称解析部门 ID（优先启用部门） */
function resolveDepartmentId(departmentName: string): string {
  const enabled = MOCK_ALL_DEPARTMENTS.find(
    (item) => item.departmentName === departmentName && item.status === 'enabled',
  )
  if (enabled) {
    return enabled.departmentId
  }
  const matched = MOCK_ALL_DEPARTMENTS.find((item) => item.departmentName === departmentName)
  return matched?.departmentId ?? MOCK_ALL_DEPARTMENTS[0].departmentId
}

/** 按负责人姓名解析用户 ID，找不到时按序号回退 */
function resolveOwnerUserId(ownerName: string, index: number): string {
  return (
    findMockEnabledUserByRealName(ownerName)?.userId ??
    MOCK_ALL_USERS[index % MOCK_ALL_USERS.length].userId
  )
}

function buildMockProjects(count: number): Project[] {
  return Array.from({ length: count }, (_, index) => {
    const seed = PROJECT_SEEDS[index % PROJECT_SEEDS.length]
    const seq = index + 1
    const suffix = seq > PROJECT_SEEDS.length ? `-${seq}` : ''

    return {
      projectId: `proj-${String(seq).padStart(3, '0')}`,
      projectName: suffix ? `${seed.projectName}${suffix}` : seed.projectName,
      description: seed.description,
      owner: seed.owner,
      ownerUserId: resolveOwnerUserId(seed.owner, index),
      department: seed.department,
      departmentId: resolveDepartmentId(seed.department),
      status: seed.status,
      taskCount: seed.taskCount,
      lastScanAt: seed.lastScanAt,
      createdAt: new Date(
        new Date(seed.createdAt).getTime() - index * 86_400_000,
      ).toISOString(),
    }
  })
}

/** 项目列表 mock 数据源（支持筛选、分页、增删改） */
export const MOCK_ALL_PROJECTS: Project[] = buildMockProjects(MOCK_PROJECT_TOTAL)
// export const MOCK_ALL_PROJECTS: Project[] = []
