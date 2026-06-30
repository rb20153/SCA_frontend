import type {
  FetchKbVersionUpdateResult,
  KbVersion,
  KbVersionOverview,
  KbVersionStatus,
  UploadKbVersionPackageResult,
} from '@/types/knowledge'
import { MOCK_ALL_KB_PROJECTS } from '@/mock/modules/knowledge/knowledgeList'

interface KbVersionTemplate {
  versionNo: string
  description: string
  referencedProjectCount: number
  status: KbVersionStatus
  createdAt: string
  indexBuildTraceId?: string
  updateNotes?: string
}

/** OpenFOAM 索引构建 TraceID（与 system/logList mock 对齐） */
export const MOCK_KB_INDEX_BUILD_TRACE_ID = 'trace-kb-index-v2406-rc1'

/**
 * 按业务规则解析版本状态（按创建时间从新到旧，index 0 为最新）
 * - 有在途构建：最新一条 indexing，次新一條 ready，其余 archived
 * - 无在途构建：最新一条 ready，其余 archived
 */
function resolveVersionStatus(index: number, hasPendingIndexBuild: boolean): KbVersionStatus {
  if (hasPendingIndexBuild) {
    if (index === 0) return 'indexing'
    if (index === 1) return 'ready'
    return 'archived'
  }
  if (index === 0) return 'ready'
  return 'archived'
}

/** 是否存在「最新版正在索引构建」的在途快照（mock：版本数 ≥ 2 时模拟） */
function hasPendingIndexBuild(versionCount: number): boolean {
  return versionCount >= 2
}

const OPENFOAM_VERSION_TEMPLATES: KbVersionTemplate[] = [
  {
    versionNo: 'v2406-rc1',
    description: '获取更新生成的候选版本，索引构建完成后将替换当前基线',
    referencedProjectCount: 26,
    status: 'indexing',
    createdAt: '2026-05-28T22:10:00+08:00',
    indexBuildTraceId: MOCK_KB_INDEX_BUILD_TRACE_ID,
  },
  {
    versionNo: 'v2312',
    description: '当前基线，已完成目录索引与漏洞映射',
    referencedProjectCount: 24,
    status: 'ready',
    createdAt: '2026-03-01T09:00:00+08:00',
    updateNotes:
      '本版本为 OpenFOAM v2312 稳定快照。\n\n· 完成全量目录索引与漏洞组件映射\n· 指纹库与 v2306 差异已合并\n· 当前项目检测任务默认绑定此基线',
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
    status: 'archived',
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

/** 为 ready / indexing 状态生成 mock 扩展字段 */
function enrichVersionFields(
  versionNo: string,
  status: KbVersionStatus,
  kbProjectId: string,
  seq: number,
): Pick<KbVersion, 'indexBuildTraceId' | 'updateNotes'> {
  if (status === 'indexing') {
    return {
      indexBuildTraceId:
        kbProjectId === 'kb-001'
          ? MOCK_KB_INDEX_BUILD_TRACE_ID
          : `trace-kb-index-${kbProjectId}-v${seq}`,
    }
  }
  if (status === 'ready') {
    return {
      updateNotes: `${versionNo} 为当前检测基线，已完成目录索引与漏洞映射。`,
    }
  }
  return {}
}

/** 为非 OpenFOAM 项目生成版本列表 */
function buildGenericVersions(
  kbProjectId: string,
  projectName: string,
  versionCount: number,
  referencedProjectCount: number,
  latestVersion: string,
): KbVersion[] {
  const pendingIndex = hasPendingIndexBuild(versionCount)
  const versions: KbVersion[] = []

  for (let i = 0; i < versionCount; i += 1) {
    const status = resolveVersionStatus(i, pendingIndex)
    const seq = versionCount - i
    let versionNo: string
    if (pendingIndex && i === 0) {
      versionNo = `${latestVersion}-rc1`
    } else if (pendingIndex && i === 1) {
      versionNo = latestVersion
    } else if (!pendingIndex && i === 0) {
      versionNo = latestVersion
    } else {
      versionNo = `${latestVersion}-hist-${seq}`
    }

    versions.push({
      versionId: `${kbProjectId}-ver-${String(seq).padStart(2, '0')}`,
      kbProjectId,
      versionNo,
      description:
        status === 'indexing'
          ? `${projectName} 获取更新生成的候选版本`
          : status === 'ready'
            ? `${projectName} 当前基线版本`
            : `${projectName} 历史快照 ${versionNo}`,
      referencedProjectCount: Math.max(1, referencedProjectCount - i),
      status,
      createdAt: new Date(
        Date.now() - i * 86_400_000 * 14,
      ).toISOString(),
      ...enrichVersionFields(versionNo, status, kbProjectId, seq),
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

/** 从版本列表中取当前基线（唯一 ready 版本号） */
function pickCurrentBaseline(versions: KbVersion[], fallback: string): string {
  return versions.find((item) => item.status === 'ready')?.versionNo ?? fallback
}

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
    versions.find((item) => item.status === 'indexing')?.createdAt
    ?? versions[0]?.createdAt
    ?? project.updatedAt

  return {
    kbProjectId: project.kbProjectId,
    projectName: project.projectName,
    currentBaseline: pickCurrentBaseline(versions, project.latestVersion),
    managedVersionCount: versions.length,
    referencedProjectCount: project.referencedProjectCount,
    lastFetchedAt,
  }
}

/** 获取版本更新（云端拉取）mock 响应 */
export function mockFetchKbVersionUpdate(_kbProjectId: string): FetchKbVersionUpdateResult {
  return {
    packageSizeGb: 2.4,
    estimatedMinutes: 18,
    message: '系统已开始拉取云端仓库差异并创建版本快照。',
  }
}

/** 上传版本更新包 mock 响应 */
export function mockUploadKbVersionPackage(
  _kbProjectId: string,
  _file: File,
): UploadKbVersionPackageResult {
  return {
    parseTaskId: 'kb-upload-task-mock-001',
  }
}

/** 恢复已归档版本 mock（仅返回成功，不修改本地 mock 列表状态） */
export function mockRestoreKbVersion(
  kbProjectId: string,
  versionId: string,
): void {
  const versions = MOCK_VERSIONS_BY_PROJECT.get(kbProjectId)
  const target = versions?.find((item) => item.versionId === versionId)
  if (!target || target.status !== 'archived') {
    throw new Error('仅已归档版本可恢复')
  }
}
