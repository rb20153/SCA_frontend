import type {
  AddProjectSourceDeliverableParams,
  CollectedProjectDeliverable,
  ProjectDeliverable,
  ProjectDeliverableDownloadResult,
  ProjectDeliverableQueryParams,
  DeliverableSourceMode,
  DeliverableType,
  UploadProjectBinaryDeliverableParams,
} from '@/types/project'

interface ProjectDeliverableRecord extends ProjectDeliverable {
  projectId: string
}

interface DeliverableSeed {
  name: string
  sourceMode: DeliverableSourceMode
  deliverableType: DeliverableType
  sizeBytes: number
  md5: string
  uploaderName: string
  uploadedAt: string
  repositoryUrl?: string
  fileName?: string
}

/** 各项目初始交付物种子 */
const DELIVERABLE_SEEDS: Record<string, DeliverableSeed[]> = {
  'proj-001': [
    {
      name: '飞控核心源码仓库',
      sourceMode: 'repo-pull',
      deliverableType: 'source',
      sizeBytes: 0,
      md5: '—',
      uploaderName: '张三',
      uploadedAt: '2026-05-02T10:30:00+08:00',
      repositoryUrl: 'https://github.com/',
    },
    {
      name: '飞控仿真源码包',
      sourceMode: 'upload-source-package',
      deliverableType: 'source',
      sizeBytes: 52_428_800,
      md5: 'a3f5c8d9e2b147608593abc012345678',
      uploaderName: '张三',
      uploadedAt: '2026-05-03T14:20:00+08:00',
      fileName: 'flight-control-src.zip',
    },
    {
      name: '导航模块二进制',
      sourceMode: 'upload-file',
      deliverableType: 'binary',
      sizeBytes: 4_194_304,
      md5: 'b7e2a1f904c356781234567890abcdef',
      uploaderName: '王五',
      uploadedAt: '2026-05-05T09:15:00+08:00',
      fileName: 'nav-module.so',
    },
  ],
  'proj-002': [
    {
      name: '结构分析主仓库',
      sourceMode: 'repo-pull',
      deliverableType: 'source',
      sizeBytes: 0,
      md5: '—',
      uploaderName: '李四',
      uploadedAt: '2026-04-21T11:00:00+08:00',
      repositoryUrl: 'https://github.com/',
    },
    {
      name: '结构求解器源码包',
      sourceMode: 'upload-source-package',
      deliverableType: 'source',
      sizeBytes: 89_100_288,
      md5: 'c1d2e3f4a5b6789012345678abcdef90',
      uploaderName: '李四',
      uploadedAt: '2026-04-22T16:45:00+08:00',
      fileName: 'struct-solver.tar.gz',
    },
    {
      name: '刚度矩阵计算库',
      sourceMode: 'upload-file',
      deliverableType: 'binary',
      sizeBytes: 2_097_152,
      md5: 'd4e5f6a7b8c9012345678901234abcde',
      uploaderName: '张三',
      uploadedAt: '2026-04-25T08:30:00+08:00',
      fileName: 'stiffness-calc.dll',
    },
    {
      name: '网格划分工具链',
      sourceMode: 'upload-source-package',
      deliverableType: 'source',
      sizeBytes: 34_603_008,
      md5: 'e5f6a7b8c9012345678901234abcdef01',
      uploaderName: '吴九',
      uploadedAt: '2026-05-01T13:20:00+08:00',
      fileName: 'mesh-toolchain.zip',
    },
    {
      name: '后处理静态库',
      sourceMode: 'upload-file',
      deliverableType: 'binary',
      sizeBytes: 1_572_864,
      md5: 'f6a7b8c9012345678901234abcdef0123',
      uploaderName: '李四',
      uploadedAt: '2026-05-08T17:10:00+08:00',
      fileName: 'postprocess.a',
    },
  ],
}

/** 为分页测试追加的通用交付物种子 */
const EXTRA_DELIVERABLE_TEMPLATES: DeliverableSeed[] = [
  {
    name: '仿真接口源码包',
    sourceMode: 'upload-source-package',
    deliverableType: 'source',
    sizeBytes: 28_311_552,
    md5: '1234567890abcdef1234567890abcdef',
    uploaderName: '赵六',
    uploadedAt: '2026-05-10T10:00:00+08:00',
    fileName: 'sim-interface.zip',
  },
  {
    name: '驱动层二进制',
    sourceMode: 'upload-file',
    deliverableType: 'binary',
    sizeBytes: 3_145_728,
    md5: 'abcdef1234567890abcdef1234567890',
    uploaderName: '林二',
    uploadedAt: '2026-05-12T15:30:00+08:00',
    fileName: 'driver-layer.so',
  },
]

/** 构建项目交付物 mock 数据 */
function buildInitialDeliverables(): ProjectDeliverableRecord[] {
  const records: ProjectDeliverableRecord[] = []
  let seq = 1

  for (const [projectId, seeds] of Object.entries(DELIVERABLE_SEEDS)) {
    for (const seed of seeds) {
      records.push({
        deliverableId: `dlv-${String(seq).padStart(3, '0')}`,
        projectId,
        ...seed,
      })
      seq += 1
    }
  }

  for (let i = 0; i < EXTRA_DELIVERABLE_TEMPLATES.length; i += 1) {
    const template = EXTRA_DELIVERABLE_TEMPLATES[i]
    records.push({
      deliverableId: `dlv-${String(seq).padStart(3, '0')}`,
      projectId: 'proj-002',
      name: `${template.name}-${i + 1}`,
      ...template,
      uploadedAt: new Date(
        new Date(template.uploadedAt).getTime() + i * 86_400_000,
      ).toISOString(),
    })
    seq += 1
  }

  return records
}

/** 项目交付物 mock 数据源 */
export const MOCK_PROJECT_DELIVERABLES: ProjectDeliverableRecord[] = buildInitialDeliverables()

/**
 * 分页获取项目交付物
 * @param params - 项目 ID 与分页
 */
export function getMockProjectDeliverablePage(params: ProjectDeliverableQueryParams) {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 10

  const sorted = MOCK_PROJECT_DELIVERABLES.filter(
    (item) => item.projectId === params.projectId,
  ).sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
  )

  const start = (page - 1) * pageSize
  const list = sorted
    .slice(start, start + pageSize)
    .map(({ projectId: _pid, ...item }) => item)

  return {
    list,
    total: sorted.length,
    page,
    pageSize,
  }
}

/**
 * mock：生成交付物下载信息
 * @param deliverableId - 交付物 ID
 */
export function createMockDeliverableDownload(
  projectId: string,
  deliverableId: string,
): ProjectDeliverableDownloadResult {
  const item = MOCK_PROJECT_DELIVERABLES.find(
    (record) => record.deliverableId === deliverableId && record.projectId === projectId,
  )
  if (!item || item.sourceMode === 'repo-pull') {
    throw new Error('交付物不存在或不可下载')
  }

  const fileName =
    item.fileName ??
    (item.deliverableType === 'source' ? 'deliverable.zip' : 'deliverable.so')

  const blob = new Blob([`mock deliverable: ${item.name}`], { type: 'application/octet-stream' })

  return {
    downloadUrl: URL.createObjectURL(blob),
    fileName,
  }
}

/**
 * mock：删除项目交付物
 * @param projectId - 项目 ID
 * @param deliverableId - 交付物 ID
 */
export function mockDeleteProjectDeliverable(projectId: string, deliverableId: string): null {
  const index = MOCK_PROJECT_DELIVERABLES.findIndex(
    (item) => item.projectId === projectId && item.deliverableId === deliverableId,
  )
  if (index < 0) {
    throw new Error('交付物不存在')
  }

  MOCK_PROJECT_DELIVERABLES.splice(index, 1)
  return null
}

/**
 * mock：创建项目时批量写入交付物记录
 * @param projectId - 项目 ID
 * @param uploaderName - 上传人姓名
 * @param deliverables - 向导收集的交付物
 */
export function mockAppendProjectDeliverablesFromCreate(
  projectId: string,
  uploaderName: string,
  deliverables: CollectedProjectDeliverable[],
): void {
  const now = new Date().toISOString()

  for (const item of deliverables) {
    const deliverableId = `dlv-${String(MOCK_PROJECT_DELIVERABLES.length + 1).padStart(3, '0')}`

    if (item.type === 'binary') {
      const file = item.data.file
      MOCK_PROJECT_DELIVERABLES.push({
        deliverableId,
        projectId,
        name: file.name,
        sourceMode: 'upload-file',
        deliverableType: 'binary',
        sizeBytes: file.size,
        md5: '—',
        uploaderName,
        uploadedAt: now,
        fileName: file.name,
      })
      continue
    }

    const params = item.data
    if (params.sourceMode === 'repo-pull') {
      MOCK_PROJECT_DELIVERABLES.push({
        deliverableId,
        projectId,
        name: params.repositoryUrl.trim() || '源码仓库',
        sourceMode: 'repo-pull',
        deliverableType: 'source',
        sizeBytes: 0,
        md5: '—',
        uploaderName,
        uploadedAt: now,
        repositoryUrl: params.repositoryUrl.trim(),
      })
      continue
    }

    const packageFile = params.packageFile
    MOCK_PROJECT_DELIVERABLES.push({
      deliverableId,
      projectId,
      name: packageFile?.name ?? '源码包',
      sourceMode: 'upload-source-package',
      deliverableType: 'source',
      sizeBytes: packageFile?.size ?? 0,
      md5: '—',
      uploaderName,
      uploadedAt: now,
      fileName: packageFile?.name,
    })
  }
}

/**
 * mock：上传二进制交付物（后端异步解析，不立即写入列表）
 * @param projectId - 项目 ID
 * @param file - 上传的二进制文件
 */
export function mockUploadProjectBinaryDeliverable(
  projectId: string,
  file: File,
): { parseTaskId: string } {
  void projectId
  void file
  return { parseTaskId: `parse-${Date.now()}` }
}

/**
 * mock：添加源码交付物（后端异步解析，不立即写入列表）
 * @param projectId - 项目 ID
 * @param params - 添加参数
 */
export function mockAddProjectSourceDeliverable(
  projectId: string,
  params: AddProjectSourceDeliverableParams,
): { parseTaskId: string } {
  void projectId
  void params
  return { parseTaskId: `parse-src-${Date.now()}` }
}
