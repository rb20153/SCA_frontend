import type { PageNavTabItem, StatCardItem } from '@/types/common'
import type {
  DetectTask,
  OpenSourceRiskDetailHeadInfo,
  OpenSourceRiskDetailSummary,
  OpenSourceRiskDetailTabKey,
} from '@/types/detect'
import { TASK_SOURCE_MODE_LABEL } from '@/utils/taskDisplay'
import { formatProjectDateTime } from '@/utils/projectDisplay'

/** 开源风险详情页 Tab 配置 */
export const OPEN_SOURCE_RISK_DETAIL_TABS: PageNavTabItem[] = [
  { key: 'components', label: '组件清单' },
  { key: 'vulnerabilities', label: '漏洞风险' },
  { key: 'sbom', label: 'SBOM导出' },
] satisfies PageNavTabItem[]

/** 从 DetectTask 组装详情页顶部展示字段 */
export function buildOpenSourceRiskHeadInfo(task: DetectTask): OpenSourceRiskDetailHeadInfo {
  return {
    taskId: task.taskId,
    projectName: task.projectName,
    taskName: task.taskName,
    status: task.status,
    finishedAt: task.finishedAt ?? null,
    dataSourceLabel: TASK_SOURCE_MODE_LABEL[task.sourceMode],
    vulnDbVersion: task.vulnDbVersion ?? '—',
  }
}

/** 将开源风险统计摘要转为 StatCardRow 数据 */
export function mapOpenSourceRiskSummaryToStatCards(
  summary: OpenSourceRiskDetailSummary,
): StatCardItem[] {
  return [
    {
      key: 'components',
      label: '识别组件',
      value: String(summary.identifiedComponentCount),
    },
    {
      key: 'highRisk',
      label: '高危漏洞',
      value: String(summary.highRiskVulnCount),
      warnValue: true,
    },
    {
      key: 'pending',
      label: '待处理漏洞',
      value: String(summary.pendingCount),
    },
    {
      key: 'license',
      label: '许可证风险',
      value: String(summary.licenseRiskCount),
    },
  ]
}

/** 格式化开源风险详情完成时间 */
export function formatRiskDetailFinishedAt(finishedAt: string | null): string {
  return formatProjectDateTime(finishedAt)
}

/** 校验 Tab key 是否合法 */
export function isOpenSourceRiskDetailTabKey(value: string): value is OpenSourceRiskDetailTabKey {
  return OPEN_SOURCE_RISK_DETAIL_TABS.some((tab) => tab.key === value)
}
