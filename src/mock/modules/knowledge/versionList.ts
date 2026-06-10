import type { KbVersion, KbVersionOverview, KbVersionStatus } from '@/types/knowledge'
import { MOCK_ALL_KB_PROJECTS } from '@/mock/modules/knowledge/knowledgeList'

interface KbVersionTemplate {
  versionNo: string
  description: string
  referencedProjectCount: number
  status: KbVersionStatus
  createdAt: string
}

const OPENFOAM_VERSION_TEMPLATES: KbVersionTemplate[] = [
  {
    versionNo: 'v2312',
    description: '稳定版，已完成目录索引与漏洞映射',
    referencedProjectCount: 24,
    status: 'ready',
    createdAt: '2026-03-01T09:00:00+08:00',
  },
  {
    versionNo: 'v2406-rc1',
    description: '获取更新生成的候选版本',
    referencedProjectCount: 26,
    status: 'indexing',
    createdAt: '2026-05-28T22:10:00+08:00',
  },
  {
    versionNo: 'v2306',
    description: '历史版，用于旧任务追溯',
    referencedProjectCount: 19,
    status: 'archived',
    createdAt: '2025-12-01T10:00:00+08:00',
  },
  {
    versionNo: 'v2304',
    description: '季度更新批次 KB-2026Q1-02 入库',
    referencedProjectCount: 18,
    status: 'archived',
    createdAt: '2025-09-15T14:30:00+08:00',
  },
  {
    versionNo: 'v2212',
    description: '已完成指纹索引重建',
    referencedProjectCount: 17,
    status: 'archived',
    createdAt: '2025-06-20T11:00:00+08:00',
  },
  {
    versionNo: 'v2210',
    description: '修复目录树缺失节点后重新快照',
    referencedProjectCount: 16,
    status: 'ready',
    createdAt: '2025-04-08T16:45:00+08:00',
  },
  {
    versionNo: 'v2206',
    description: '上传源码包生成的基线版本',
    referencedProjectCount: 15,
    status: 'archived',
    createdAt: '2025-02-18T09:20:00+08:00',
  },
  {
    versionNo: 'v2112',
    description: '漏洞映射规则升级后补跑',
    referencedProjectCount: 14,
    status: 'archived',
    createdAt: '2024-12-05T13:10:00+08:00',
  },
  {
    versionNo: 'v2106',
    description: '历史追溯版本，仅保留元数据',
    referencedProjectCount: 13,
    status: 'archived',
    createdAt: '2024-08-22T10:00:00+08:00',
  },
  {
    versionNo: 'v2012',
    description: '早期导入版本',
    referencedProjectCount: 12,
    status: 'archived',
    createdAt: '2024-03-11T08:30:00+08:00',
  },
  {
    versionNo: 'v2006',
    description: '首次云端拉取入库',
    referencedProjectCount: 11,
    status: 'archived',
    createdAt: '2023-11-02T15:00:00+08:00',
  },
  {
    versionNo: 'v2004',
    description: '初始快照',
    referencedProjectCount: 10,
    status: 'archived',
    createdAt: '2023-08-19T09:00:00+08:00',
  },
]

const STATUS_ROTATION: KbVersionStatus[] = ['ready', 'ready', 'indexing', 'archived', 'archived']

/** 为非 OpenFOAM 项目生成版本列表 */
function buildGenericVersions(
  kbProjectId: string,
  projectName: string,
  versionCount: number,
  referencedProjectCount: number,
  latestVersion: string,
): KbVersion[] {
  const versions: KbVersion[] = []

  for (let i = 0; i < versionCount; i += 1) {
    const status = i === 0 ? 'ready' : STATUS_ROTATION[i % STATUS_ROTATION.length]
    const seq = versionCount - i
    const versionNo = i === 0 ? latestVersion : `${latestVersion}-hist-${seq}`

    versions.push({
      versionId: `${kbProjectId}-ver-${String(seq).padStart(2, '0')}`,
      kbProjectId,
      versionNo,
      description:
        i === 0
          ? `${projectName} 当前基线版本`
          : `${projectName} 历史快照 v${seq}`,
      referencedProjectCount: Math.max(1, referencedProjectCount - i),
      status,
      createdAt: new Date(
        Date.now() - i * 86_400_000 * 14,
      ).toISOString(),
    })
  }

  return versions.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

/** 按开源项目生成完整版本 mock 列表 */
function buildVersionsForProject(
  kbProjectId: string,
  projectName: string,
  versionCount: number,
  referencedProjectCount: number,
  latestVersion: string,
): KbVersion[] {
  if (projectName === 'OpenFOAM' && kbProjectId === 'kb-001') {
    return OPENFOAM_VERSION_TEMPLATES.map((item, index) => ({
      versionId: `${kbProjectId}-ver-${String(index + 1).padStart(2, '0')}`,
      kbProjectId,
      ...item,
    })).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  }

  return buildGenericVersions(
    kbProjectId,
    projectName,
    versionCount,
    referencedProjectCount,
    latestVersion,
  )
}

const MOCK_VERSIONS_BY_PROJECT = new Map<string, KbVersion[]>(
  MOCK_ALL_KB_PROJECTS.map((project) => [
    project.kbProjectId,
    buildVersionsForProject(
      project.kbProjectId,
      project.projectName,
      project.versionCount,
      project.referencedProjectCount,
      project.latestVersion,
    ),
  ]),
)

/** 获取指定知识库项目的全部版本 mock */
export function getMockKbVersions(kbProjectId: string): KbVersion[] {
  return [...(MOCK_VERSIONS_BY_PROJECT.get(kbProjectId) ?? [])]
}

/** 获取版本管理页概览 mock */
export function getMockKbVersionOverview(kbProjectId: string): KbVersionOverview | null {
  const project = MOCK_ALL_KB_PROJECTS.find((item) => item.kbProjectId === kbProjectId)
  if (!project) return null

  const versions = getMockKbVersions(kbProjectId)
  const lastFetchedAt =
    versions[0]?.createdAt ?? project.updatedAt

  return {
    kbProjectId: project.kbProjectId,
    projectName: project.projectName,
    currentBaseline: project.latestVersion,
    managedVersionCount: versions.length,
    referencedProjectCount: project.referencedProjectCount,
    lastFetchedAt,
  }
}
