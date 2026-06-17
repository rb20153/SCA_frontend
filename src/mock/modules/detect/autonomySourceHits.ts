import type { PageResult } from '@/types/common'
import type {
  AutonomySourceHitItem,
  AutonomySourceHitQueryParams,
} from '@/types/detect'

const MOCK_SOURCE_HITS: Omit<AutonomySourceHitItem, 'hitId'>[] = [
  {
    kbProjectId: 'kb-openfoam',
    kbProjectName: 'OpenFOAM',
    kbVersion: 'v2312',
    hitFileNames: ['solver.cpp', 'inlet'],
    license: 'GPL-3.0',
    riskLevel: 'high',
  },
  {
    kbProjectId: 'kb-eigen',
    kbProjectName: 'Eigen',
    kbVersion: '3.4.0',
    hitFileNames: ['mesh.cpp'],
    license: 'MPL-2.0',
    riskLevel: 'low',
  },
  {
    kbProjectId: 'kb-openfoam',
    kbProjectName: 'OpenFOAM',
    kbVersion: 'v2406',
    hitFileNames: ['boundary.cpp'],
    license: 'GPL-3.0',
    riskLevel: 'high',
  },
  {
    kbProjectId: 'kb-fmt',
    kbProjectName: 'fmt',
    kbVersion: '10.2.1',
    hitFileNames: ['solver.cpp'],
    license: 'MIT',
    riskLevel: 'low',
  },
  {
    kbProjectId: 'kb-dealii',
    kbProjectName: 'Deal.II',
    kbVersion: '9.5.2',
    hitFileNames: ['mesh.cpp', 'boundary.cpp'],
    license: 'LGPL-2.1',
    riskLevel: 'medium',
  },
  {
    kbProjectId: 'kb-petsc',
    kbProjectName: 'PETSc',
    kbVersion: '3.20.0',
    hitFileNames: ['solver.cpp'],
    license: 'BSD-2-Clause',
    riskLevel: 'medium',
  },
  {
    kbProjectId: 'kb-openfoam',
    kbProjectName: 'OpenFOAM',
    kbVersion: 'v2312',
    hitFileNames: ['outlet'],
    license: 'GPL-3.0',
    riskLevel: 'high',
  },
  {
    kbProjectId: 'kb-eigen',
    kbProjectName: 'Eigen',
    kbVersion: '3.4.0',
    hitFileNames: ['inlet'],
    license: 'MPL-2.0',
    riskLevel: 'low',
  },
  {
    kbProjectId: 'kb-hdf5',
    kbProjectName: 'HDF5',
    kbVersion: '1.14.3',
    hitFileNames: ['boundary.cpp'],
    license: 'BSD-3-Clause',
    riskLevel: 'medium',
  },
  {
    kbProjectId: 'kb-boost',
    kbProjectName: 'Boost',
    kbVersion: '1.84.0',
    hitFileNames: ['mesh.cpp'],
    license: 'BSL-1.0',
    riskLevel: 'low',
  },
  {
    kbProjectId: 'kb-openmpi',
    kbProjectName: 'OpenMPI',
    kbVersion: '4.1.6',
    hitFileNames: ['solver.cpp', 'mesh.cpp'],
    license: 'BSD-3-Clause',
    riskLevel: 'medium',
  },
  {
    kbProjectId: 'kb-cgal',
    kbProjectName: 'CGAL',
    kbVersion: '5.6',
    hitFileNames: ['inlet', 'outlet'],
    license: 'GPL-3.0',
    riskLevel: 'high',
  },
]

/**
 * mock：按任务 ID 与筛选条件返回来源汇总分页列表
 * @param taskId - 检测任务 ID
 * @param params - 筛选与分页
 */
export function getMockAutonomySourceHitPage(
  taskId: string,
  params: AutonomySourceHitQueryParams,
): PageResult<AutonomySourceHitItem> {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 10
  const prefix = taskId.replace(/\W/g, '') || '1'

  let list = MOCK_SOURCE_HITS.map((item, index) => ({
    ...item,
    hitId: `${prefix}-hit-${index + 1}`,
  }))

  const kbProjectName = params.kbProjectName?.trim()
  if (kbProjectName) {
    list = list.filter((item) => item.kbProjectName.includes(kbProjectName))
  }

  if (params.riskLevel) {
    list = list.filter((item) => item.riskLevel === params.riskLevel)
  }

  const total = list.length
  const start = (page - 1) * pageSize
  const pageList = list.slice(start, start + pageSize)

  return {
    list: pageList,
    total,
    page,
    pageSize,
  }
}
