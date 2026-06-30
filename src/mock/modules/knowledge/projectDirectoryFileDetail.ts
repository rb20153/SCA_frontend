import type { FileTreeNode } from '@/types/fileTree'
import type {
  KbProjectFileDetail,
  KbProjectFileDetailQueryParams,
  KbProjectFileMetadataExportParams,
  KbProjectFileMetadataExportResult,
  KbProjectFingerprintSummaryRow,
} from '@/types/knowledge'
import { getMockKbProjectDirectoryTree } from '@/mock/modules/knowledge/projectDirectoryTree'
import { findFileTreeNodeById } from '@/utils/fileTree'

interface FileDetailSeed {
  fileType: string
  sizeLabel: string
  sha1: string
  fingerprintSummary: string
  licenseClue: string
  sourceCandidates: string[]
  updatedAt: string
  writeContext: string
  fingerprintSummaries: KbProjectFingerprintSummaryRow[]
}

/** 按树节点 localId 预置的详情种子（对齐原型 createFields.H 等） */
const FILE_DETAIL_SEED_BY_LOCAL_ID: Record<string, FileDetailSeed> = {
  'file-create-fields': {
    fileType: 'C/C++ Header',
    sizeLabel: '2.4 KB',
    sha1: 'a94a8fe5ccb19ba61c4c0873d391e987982fbbd3',
    fingerprintSummary: 'fp-openfoam-createFields-v2312',
    licenseClue: 'GPL-3.0（文件头注释）',
    sourceCandidates: ['OpenFOAM 官方仓库', 'OpenFOAM v2312 发行版'],
    updatedAt: '2026-05-28T14:32:00+08:00',
    writeContext: '由季度更新任务 KB-2026Q2-01 写入',
    fingerprintSummaries: [
      {
        rowId: 'fp-text-hash',
        dimension: '文本哈希',
        hitCount: 1,
        maxConfidence: 0.98,
        description: '与 OpenFOAM v2312 参考库 createFields.H 全文哈希一致',
      },
      {
        rowId: 'fp-structure',
        dimension: '结构指纹',
        hitCount: 2,
        maxConfidence: 0.92,
        description: '字段声明块与 simpleFoam 求解器模板结构匹配',
      },
      {
        rowId: 'fp-license',
        dimension: '许可证片段',
        hitCount: 1,
        maxConfidence: 0.85,
        description: '文件头 GPL 声明与项目 meta/LICENSE 关联',
      },
    ],
  },
  'file-license': {
    fileType: 'Text',
    sizeLabel: '34.6 KB',
    sha1: '7110eda4d09e062aa5cf051c65a8aa4c24a38e023',
    fingerprintSummary: 'fp-openfoam-license-v2312',
    licenseClue: 'GPL-3.0',
    sourceCandidates: ['OpenFOAM Foundation'],
    updatedAt: '2026-05-28T14:30:00+08:00',
    writeContext: '由季度更新任务 KB-2026Q2-01 写入',
    fingerprintSummaries: [
      {
        rowId: 'fp-license-full',
        dimension: '许可证全文',
        hitCount: 1,
        maxConfidence: 0.99,
        description: '与 SPDX GPL-3.0-only 标准文本高度一致',
      },
    ],
  },
  'file-matrix-h': {
    fileType: 'C/C++ Header',
    sizeLabel: '18.2 KB',
    sha1: 'eigen-matrix-h-sha1-placeholder-001',
    fingerprintSummary: 'fp-eigen-matrix-h',
    licenseClue: 'MPL-2.0',
    sourceCandidates: ['Eigen 官方仓库', 'Eigen 3.4.x'],
    updatedAt: '2026-04-15T09:20:00+08:00',
    writeContext: '由版本快照 v3.4.0 索引任务写入',
    fingerprintSummaries: [
      {
        rowId: 'fp-eigen-core',
        dimension: 'API 结构',
        hitCount: 3,
        maxConfidence: 0.94,
        description: 'Matrix 模板类声明与 Eigen Core 模块一致',
      },
    ],
  },
}

/** 从 nodeId 解析 localId（去掉版本前缀） */
function parseLocalNodeId(fileNodeId: string): string {
  const colonIndex = fileNodeId.indexOf(':')
  if (colonIndex === -1) {
    return fileNodeId
  }
  return fileNodeId.slice(colonIndex + 1)
}

/** 根据扩展名推断文件类型标签 */
function inferFileTypeLabel(fileName: string): string {
  const lower = fileName.toLowerCase()
  if (lower === 'license' || lower.endsWith('.md')) {
    return 'Text'
  }
  if (lower.endsWith('.h') || lower.endsWith('.hpp')) {
    return 'C/C++ Header'
  }
  if (lower.endsWith('.c') || lower.endsWith('.cpp') || lower.endsWith('.cc')) {
    return 'C/C++ Source'
  }
  if (lower.endsWith('.dict')) {
    return 'Config'
  }
  return 'Binary / Other'
}

/** 根据 MD5 生成稳定的 mock 文件大小 */
function mockSizeLabel(md5: string): string {
  const num = parseInt(md5.slice(0, 4), 16)
  const kb = ((num % 480) + 12) / 10
  return `${kb.toFixed(1)} KB`
}

/** 为未预置的文件生成兜底 SHA1 */
function mockSha1(md5: string): string {
  return `${md5.slice(0, 20)}sha1mock${md5.slice(-12)}`
}

/** 构建未预置文件的兜底摘要表 */
function buildFallbackSummaries(node: FileTreeNode): KbProjectFingerprintSummaryRow[] {
  return [
    {
      rowId: 'fp-fallback-hash',
      dimension: '文本哈希',
      hitCount: 1,
      maxConfidence: 0.76,
      description: `已建立 ${node.name} 的基础入库指纹，待后续版本增量比对`,
    },
  ]
}

/** 将树节点与种子合并为完整详情 */
function buildFileDetail(node: FileTreeNode, seed: FileDetailSeed): KbProjectFileDetail {
  return {
    fileName: node.name,
    path: node.path ?? node.name,
    md5: node.md5 ?? '—',
    ...seed,
  }
}

/**
 * 获取项目目录文件详情 mock
 * @param params - 项目、版本、文件节点 ID
 */
export function getMockKbProjectFileDetail(
  params: KbProjectFileDetailQueryParams,
): KbProjectFileDetail | null {
  const tree = getMockKbProjectDirectoryTree({
    kbProjectId: params.kbProjectId,
    versionId: params.versionId,
  })
  const node = findFileTreeNodeById(tree, params.fileNodeId)
  if (!node || node.type !== 'file') {
    return null
  }

  const localId = parseLocalNodeId(params.fileNodeId)
  const seed = FILE_DETAIL_SEED_BY_LOCAL_ID[localId]
  if (seed) {
    return buildFileDetail(node, seed)
  }

  const md5 = node.md5 ?? '00000000000000000000000000000000'
  return buildFileDetail(node, {
    fileType: inferFileTypeLabel(node.name),
    sizeLabel: mockSizeLabel(md5),
    sha1: mockSha1(md5),
    fingerprintSummary: `fp-${localId.replace(/[^a-z0-9-]/gi, '-')}`,
    licenseClue: '待解析',
    sourceCandidates: ['待关联来源'],
    updatedAt: '2026-05-01T10:00:00+08:00',
    writeContext: '由目录索引任务写入',
    fingerprintSummaries: buildFallbackSummaries(node),
  })
}

/**
 * 导出文件元数据 mock（生成 JSON 下载链接）
 * @param params - 项目、版本、文件节点 ID
 */
export function getMockKbProjectFileMetadataExport(
  params: KbProjectFileMetadataExportParams,
): KbProjectFileMetadataExportResult | null {
  const detail = getMockKbProjectFileDetail(params)
  if (!detail) {
    return null
  }

  const payload = {
    kbProjectId: params.kbProjectId,
    versionId: params.versionId,
    fileNodeId: params.fileNodeId,
    exportedAt: new Date().toISOString(),
    file: detail,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const safeName = detail.fileName.replace(/[^\w.-]+/g, '_')
  return {
    downloadUrl: URL.createObjectURL(blob),
    fileName: `${safeName}-metadata.json`,
  }
}
