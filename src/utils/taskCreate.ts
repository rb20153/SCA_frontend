import type {
  AutonomySourceMode,
  RiskDependencyDepth,
  RiskScanScope,
  RiskSourceMode,
  TaskExecutionMode,
} from '@/types/common'
import type { CreateAutonomyDetectTaskParams, CreateRiskDetectTaskParams } from '@/types/detect'

/** 自主率扫描模式下拉选项 */
export const AUTONOMY_SCAN_MODE_OPTIONS: {
  value: AutonomySourceMode
  label: string
}[] = [
  { value: 'full-scan', label: '全量扫描' },
  { value: 'incremental-scan', label: '增量扫描' },
  { value: 'quick-scan', label: '快速扫描' },
]

/** 扫描模式说明（占位，待产品确认） */
export const AUTONOMY_SCAN_MODE_HINT: Record<AutonomySourceMode, string> = {
  'full-scan':
    '全量扫描：对项目全部交付物与知识库进行完整比对，耗时较长，适合基线验收与正式报告。',
  'incremental-scan':
    '增量扫描：仅处理自上次任务以来的变更内容，适合日常迭代与回归检测。',
  'quick-scan':
    '快速扫描：优先覆盖高风险目录与近期变更热点，用于快速预判是否需要发起完整扫描。',
}

/** 执行方式单选项 */
export const TASK_EXECUTION_MODE_OPTIONS: {
  value: TaskExecutionMode
  label: string
}[] = [
  { value: 'parallel', label: '并行' },
  { value: 'distributed', label: '分布式' },
]

/** 开源风险扫描范围选项 */
export const RISK_SCAN_SCOPE_OPTIONS: {
  value: RiskScanScope
  label: string
}[] = [
  { value: 'source_and_build', label: '源码 + 构建脚本' },
  { value: 'source_only', label: '仅源码' },
]

/** 开源风险数据来源选项 */
export const RISK_DATA_SOURCE_OPTIONS: {
  value: RiskSourceMode
  label: string
}[] = [
  { value: 'project-scan', label: '扫描项目' },
  { value: 'import-sbom', label: '导入 SBOM' },
]

/** 开源风险依赖深度选项 */
export const RISK_DEPENDENCY_DEPTH_OPTIONS: {
  value: RiskDependencyDepth
  label: string
}[] = [
  { value: 'direct_and_transitive', label: '直接 + 间接依赖' },
  { value: 'direct_only', label: '直接依赖' },
]

/** 返回空的自主率创建表单默认值 */
export function createDefaultAutonomyTaskForm(): Omit<
  CreateAutonomyDetectTaskParams,
  'taskType'
> {
  return {
    taskName: '',
    projectId: '',
    scanMode: 'full-scan',
    executionMode: 'parallel',
    workerCount: 4,
    autoRetryEnabled: true,
    retryCount: 3,
  }
}

/** 返回空的开源风险创建表单默认值 */
export function createDefaultRiskTaskForm(): Omit<CreateRiskDetectTaskParams, 'taskType'> {
  return {
    taskName: '',
    projectId: '',
    dataSource: 'project-scan',
    scanScope: 'source_and_build',
    vulnDbVersion: '',
    dependencyDepth: 'direct_and_transitive',
  }
}

/** 排队中任务在列表展示的固定进度 */
export const QUEUED_TASK_DISPLAY_PROGRESS = 10
