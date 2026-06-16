import type { RiskSourceMode } from '@/types/common'
import type {
  OpenSourceRiskComponentIdentifyBasis,
  OpenSourceRiskComponentListFilters,
  OpenSourceRiskComponentQueryParams,
  OpenSourceRiskComponentRiskLevel,
  OpenSourceRiskComponentIgnoreReason,
} from '@/types/detect'
import { TASK_SOURCE_MODE_LABEL } from '@/utils/taskDisplay'

/** 组件清单 · 风险等级筛选项 */
export const RISK_COMPONENT_LEVEL_FILTER_OPTIONS: {
  value: OpenSourceRiskComponentRiskLevel | ''
  label: string
}[] = [
  { value: '', label: '全部等级' },
  { value: 'high', label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low', label: '低' },
]

/** 组件清单 · 来源筛选项（项目扫描 / 导入 SBOM） */
export const RISK_COMPONENT_SOURCE_FILTER_OPTIONS: {
  value: RiskSourceMode | ''
  label: string
}[] = [
  { value: '', label: '全部来源' },
  { value: 'project-scan', label: TASK_SOURCE_MODE_LABEL['project-scan'] },
  { value: 'import-sbom', label: TASK_SOURCE_MODE_LABEL['import-sbom'] },
]

/** 组件忽略原因选项（与原型 comp-ignore 弹窗一致） */
export const RISK_COMPONENT_IGNORE_REASON_OPTIONS: {
  value: OpenSourceRiskComponentIgnoreReason
  label: string
}[] = [
  { value: 'misidentification', label: '误识别 / 非实际依赖' },
  { value: 'internal', label: '内部组件 / 不计入开源清单' },
  { value: 'covered', label: '已由其他条目覆盖' },
  { value: 'other', label: '其他' },
]

/** 组件清单 · 风险等级 Tag 配色 */
export const RISK_COMPONENT_LEVEL_COLOR: Record<OpenSourceRiskComponentRiskLevel, string> = {
  high: 'error',
  medium: 'warning',
  low: 'success',
}

/** 组件清单 · 风险等级中文 */
export const RISK_COMPONENT_LEVEL_LABEL: Record<OpenSourceRiskComponentRiskLevel, string> = {
  high: '高',
  medium: '中',
  low: '低',
}

/** 组件清单表格横向滚动宽度 */
export const RISK_COMPONENT_TABLE_SCROLL_X = 1180

/** 返回空的组件清单筛选表单 */
export function createEmptyRiskComponentListFilters(): OpenSourceRiskComponentListFilters {
  return {
    componentName: '',
    sourceMode: '',
    riskLevel: '',
    showIgnored: false,
  }
}

/** 将筛选表单转为 API 查询参数 */
export function riskComponentListFiltersToQuery(
  filters: OpenSourceRiskComponentListFilters,
): Omit<OpenSourceRiskComponentQueryParams, 'page' | 'pageSize'> {
  const query: Omit<OpenSourceRiskComponentQueryParams, 'page' | 'pageSize'> = {}
  const componentName = filters.componentName.trim()

  if (componentName) {
    query.componentName = componentName
  }
  if (filters.sourceMode) {
    query.sourceMode = filters.sourceMode
  }
  if (filters.riskLevel) {
    query.riskLevel = filters.riskLevel
  }
  if (filters.showIgnored) {
    query.includeIgnored = true
  }

  return query
}

/** 识别依据 Tag 颜色 */
export const RISK_COMPONENT_IDENTIFY_BASIS_COLOR: Record<
  OpenSourceRiskComponentIdentifyBasis,
  string
> = {
  cmake: 'blue',
  symbol: 'cyan',
  manifest: 'geekblue',
  sbom: 'purple',
}
