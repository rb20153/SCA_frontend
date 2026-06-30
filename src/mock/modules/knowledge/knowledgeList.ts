import type { CreateKbProjectParams, KbCollectMode, KbProject, KbProjectCategory } from '@/types/knowledge'

interface KbProjectSeed {
  projectName: string
  category: KbProjectCategory
  collectMode: KbCollectMode
  latestVersion: string
  versionCount: number
  referencedProjectCount: number
  tags?: string
  updatedAt: string
}

const KB_PROJECT_SEEDS: KbProjectSeed[] = [
  {
    projectName: 'OpenFOAM',
    category: 'simulation_framework',
    collectMode: 'cloud_repo',
    latestVersion: 'v2312',
    versionCount: 12,
    referencedProjectCount: 24,
    tags: 'CFD',
    updatedAt: '2026-05-18T18:20:00+08:00',
  },
  {
    projectName: 'Eigen',
    category: 'numerical_computing',
    collectMode: 'upload_package',
    latestVersion: '3.4.0',
    versionCount: 8,
    referencedProjectCount: 16,
    tags: '线性代数',
    updatedAt: '2026-05-14T09:15:00+08:00',
  },
  {
    projectName: 'fmt',
    category: 'general_dependency',
    collectMode: 'upload_package',
    latestVersion: '10.2.1',
    versionCount: 4,
    referencedProjectCount: 9,
    updatedAt: '2026-05-09T11:40:00+08:00',
  },
  {
    projectName: 'Deal.II',
    category: 'numerical_computing',
    collectMode: 'cloud_repo',
    latestVersion: '9.5.2',
    versionCount: 10,
    referencedProjectCount: 11,
    tags: '有限元',
    updatedAt: '2026-05-16T14:05:00+08:00',
  },
  {
    projectName: 'PETSc',
    category: 'numerical_computing',
    collectMode: 'cloud_repo',
    latestVersion: '3.20.1',
    versionCount: 15,
    referencedProjectCount: 19,
    updatedAt: '2026-05-12T10:30:00+08:00',
  },
  {
    projectName: 'CalculiX',
    category: 'simulation_framework',
    collectMode: 'upload_package',
    latestVersion: '2.21',
    versionCount: 6,
    referencedProjectCount: 7,
    tags: '结构仿真',
    updatedAt: '2026-05-08T16:45:00+08:00',
  },
  {
    projectName: 'protobuf',
    category: 'general_dependency',
    collectMode: 'cloud_repo',
    latestVersion: '25.3',
    versionCount: 9,
    referencedProjectCount: 14,
    updatedAt: '2026-05-20T08:00:00+08:00',
  },
  {
    projectName: 'VTK',
    category: 'pre_post_processing',
    collectMode: 'upload_package',
    latestVersion: '9.3.0',
    versionCount: 11,
    referencedProjectCount: 13,
    tags: '可视化',
    updatedAt: '2026-05-22T13:20:00+08:00',
  },
  {
    projectName: 'Gmsh',
    category: 'pre_post_processing',
    collectMode: 'cloud_repo',
    latestVersion: '4.12.1',
    versionCount: 7,
    referencedProjectCount: 10,
    tags: '网格划分',
    updatedAt: '2026-05-19T15:30:00+08:00',
  },
]

const MOCK_KB_PROJECT_TOTAL = 26

function buildMockKbProjects(count: number): KbProject[] {
  return Array.from({ length: count }, (_, index) => {
    const seed = KB_PROJECT_SEEDS[index % KB_PROJECT_SEEDS.length]
    const seq = index + 1
    const projectName =
      seq > KB_PROJECT_SEEDS.length ? `${seed.projectName}-${seq}` : seed.projectName

    return {
      kbProjectId: `kb-${String(seq).padStart(3, '0')}`,
      projectName,
      category: seed.category,
      collectMode: seed.collectMode,
      latestVersion: seed.latestVersion,
      versionCount: seed.versionCount,
      referencedProjectCount: seed.referencedProjectCount,
      tags: seed.tags,
      updatedAt: new Date(
        new Date(seed.updatedAt).getTime() - index * 43_200_000,
      ).toISOString(),
    }
  })
}

/** 知识库开源项目列表 mock 数据源 */
export const MOCK_ALL_KB_PROJECTS: KbProject[] = buildMockKbProjects(MOCK_KB_PROJECT_TOTAL)
// export const MOCK_ALL_KB_PROJECTS: KbProject[] = []

/**
 * mock：添加开源项目（后端异步处理，不立即写入列表）
 * @param params - 添加参数
 */
export function mockCreateKbProject(params: CreateKbProjectParams): { parseTaskId: string } {
  void params
  return { parseTaskId: `kb-parse-${Date.now()}` }
}