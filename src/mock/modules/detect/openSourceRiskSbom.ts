import type { PageResult } from '@/types/common'
import type {
  ExportOpenSourceRiskSbomParams,
  ExportOpenSourceRiskSbomResult,
  OpenSourceRiskSbomGranularity,
  OpenSourceRiskSbomModulePreviewRow,
  OpenSourceRiskSbomPackagePreviewRow,
  OpenSourceRiskSbomPreviewQueryParams,
  OpenSourceRiskSbomProjectPreviewRow,
} from '@/types/detect'

const PROJECT_PREVIEW_ROWS: OpenSourceRiskSbomProjectPreviewRow[] = [
  {
    rowId: 'sbom-proj-1',
    componentName: 'openssl',
    version: '3.0.8',
    license: 'Apache-2.0',
    supplier: 'OpenSSL Project',
    referenceMode: 'CMakeLists.txt',
    riskLevel: 'medium',
  },
  {
    rowId: 'sbom-proj-2',
    componentName: 'boost',
    version: '1.82.0',
    license: 'BSL-1.0',
    supplier: 'Boost',
    referenceMode: 'CMakeLists.txt',
    riskLevel: 'low',
  },
  {
    rowId: 'sbom-proj-3',
    componentName: 'xz-utils',
    version: '5.6.0',
    license: 'GPL-2.0',
    supplier: 'XZ Utils',
    referenceMode: '符号匹配',
    riskLevel: 'high',
  },
  {
    rowId: 'sbom-proj-4',
    componentName: 'curl',
    version: '8.4.0',
    license: 'MIT',
    supplier: 'curl project',
    referenceMode: 'CMakeLists.txt',
    riskLevel: 'medium',
  },
]

const MODULE_PREVIEW_ROWS: OpenSourceRiskSbomModulePreviewRow[] = [
  {
    rowId: 'sbom-mod-1',
    moduleName: 'src/solver',
    componentCount: 18,
    highRiskLicense: 'GPL-3.0',
    vulnerableComponentCount: 2,
  },
  {
    rowId: 'sbom-mod-2',
    moduleName: 'utils',
    componentCount: 6,
    highRiskLicense: 'GPL-3.0',
    vulnerableComponentCount: 0,
  },
  {
    rowId: 'sbom-mod-3',
    moduleName: 'third_party',
    componentCount: 42,
    highRiskLicense: 'Apache-2.0',
    vulnerableComponentCount: 3,
  },
  {
    rowId: 'sbom-mod-4',
    moduleName: 'network',
    componentCount: 9,
    highRiskLicense: 'MIT',
    vulnerableComponentCount: 1,
  },
]

const PACKAGE_PREVIEW_ROWS: OpenSourceRiskSbomPackagePreviewRow[] = [
  {
    rowId: 'sbom-pkg-1',
    packageLabel: 'openssl@3.0.8',
    evidenceSource: 'CMakeLists.txt + 符号匹配',
    confidence: 0.92,
    conflictHint: 'none',
    remediationSuggestion: '—',
  },
  {
    rowId: 'sbom-pkg-2',
    packageLabel: 'OpenFOAM@v2312',
    evidenceSource: '相似代码 + 指纹库命中',
    confidence: 0.76,
    conflictHint: 'conflict',
    remediationSuggestion: '隔离 GPL 代码或替换实现',
  },
  {
    rowId: 'sbom-pkg-3',
    packageLabel: 'boost@1.82.0',
    evidenceSource: 'CMakeLists.txt',
    confidence: 0.95,
    conflictHint: 'none',
    remediationSuggestion: '—',
  },
  {
    rowId: 'sbom-pkg-4',
    packageLabel: 'curl@8.4.0',
    evidenceSource: 'CMakeLists.txt',
    confidence: 0.89,
    conflictHint: 'none',
    remediationSuggestion: '—',
  },
]

function paginateList<T>(list: T[], page: number, pageSize: number): PageResult<T> {
  const total = list.length
  const start = (page - 1) * pageSize
  return {
    list: list.slice(start, start + pageSize),
    total,
    page,
    pageSize,
  }
}

/**
 * mock：分页返回 SBOM 清单预览
 * @param _taskId - 任务 ID
 * @param params - 粒度与分页
 */
export function getMockOpenSourceRiskSbomPreviewPage(
  _taskId: string,
  params: OpenSourceRiskSbomPreviewQueryParams,
): PageResult<
  | OpenSourceRiskSbomProjectPreviewRow
  | OpenSourceRiskSbomModulePreviewRow
  | OpenSourceRiskSbomPackagePreviewRow
> {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 3
  const granularity = params.granularity

  if (granularity === 'module') {
    return paginateList(MODULE_PREVIEW_ROWS, page, pageSize)
  }
  if (granularity === 'package') {
    return paginateList(PACKAGE_PREVIEW_ROWS, page, pageSize)
  }
  return paginateList(PROJECT_PREVIEW_ROWS, page, pageSize)
}

/** 生成 mock 导出文件名 */
function buildSbomExportFileName(
  taskId: string,
  params: ExportOpenSourceRiskSbomParams,
): string {
  const ext = params.fileFormat
  const standard = params.standardFormat === 'spdx' ? 'spdx' : 'cyclonedx'
  return `sbom-${taskId}-${standard}.${ext}`
}

/**
 * mock：导出 SBOM 并返回下载链接
 * @param taskId - 任务 ID
 * @param params - 导出配置
 */
export function mockExportOpenSourceRiskSbom(
  taskId: string,
  params: ExportOpenSourceRiskSbomParams,
): ExportOpenSourceRiskSbomResult {
  const fileName = buildSbomExportFileName(taskId, params)
  const payload = {
    taskId,
    standardFormat: params.standardFormat,
    fileFormat: params.fileFormat,
    granularity: params.granularity,
    exportedAt: new Date().toISOString(),
    note: 'mock SBOM export payload',
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: params.fileFormat === 'json' ? 'application/json' : 'application/xml',
  })

  return {
    downloadUrl: URL.createObjectURL(blob),
    fileName,
  }
}
