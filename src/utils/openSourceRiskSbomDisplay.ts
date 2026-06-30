import type {
  OpenSourceRiskSbomFileFormat,
  OpenSourceRiskSbomGranularity,
  OpenSourceRiskSbomStandardFormat,
} from '@/types/detect'
import {
  RISK_COMPONENT_LEVEL_COLOR,
  RISK_COMPONENT_LEVEL_LABEL,
} from '@/utils/openSourceRiskComponentQuery'

/** SBOM 标准格式选项 */
export const OPEN_SOURCE_RISK_SBOM_STANDARD_FORMAT_OPTIONS: {
  value: OpenSourceRiskSbomStandardFormat
  label: string
}[] = [
  { value: 'spdx', label: 'SPDX' },
  { value: 'cyclonedx', label: 'CycloneDX' },
]

/** SBOM 文件格式选项 */
export const OPEN_SOURCE_RISK_SBOM_FILE_FORMAT_OPTIONS: {
  value: OpenSourceRiskSbomFileFormat
  label: string
}[] = [
  { value: 'json', label: 'JSON' },
  { value: 'xml', label: 'XML' },
]

/** SBOM 输出粒度选项 */
export const OPEN_SOURCE_RISK_SBOM_GRANULARITY_OPTIONS: {
  value: OpenSourceRiskSbomGranularity
  label: string
}[] = [
  { value: 'project', label: '项目级' },
  { value: 'module', label: '模块级' },
  { value: 'package', label: '包级' },
]

/** SBOM 输出粒度中文 */
export const OPEN_SOURCE_RISK_SBOM_GRANULARITY_LABEL: Record<
  OpenSourceRiskSbomGranularity,
  string
> = {
  project: '项目级',
  module: '模块级',
  package: '包级',
}

/** SBOM 预览表格横向滚动宽度（按最宽粒度） */
export const OPEN_SOURCE_RISK_SBOM_PREVIEW_TABLE_SCROLL_X = 920

/** SBOM 预览每页条数 */
export const OPEN_SOURCE_RISK_SBOM_PREVIEW_PAGE_SIZE = 3

/** 格式化包级预览置信度 */
export function formatSbomPackageConfidence(confidence: number): string {
  return Number.isFinite(confidence) ? confidence.toFixed(2) : '—'
}

/** 包级冲突提示 Tag 配色 */
export const SBOM_PACKAGE_CONFLICT_COLOR = {
  none: 'success',
  conflict: 'warning',
} as const

/** 包级冲突提示中文 */
export const SBOM_PACKAGE_CONFLICT_LABEL = {
  none: '无',
  conflict: '许可证冲突',
} as const

export { RISK_COMPONENT_LEVEL_COLOR, RISK_COMPONENT_LEVEL_LABEL }
