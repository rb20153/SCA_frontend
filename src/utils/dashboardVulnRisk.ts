import type { DashboardVulnRiskLevel } from '@/types/dashboard'
import {
  VULN_RISK_LEVEL_COLOR,
  VULN_RISK_LEVEL_LABEL,
  VULN_RISK_LEVEL_ORDER,
} from '@/utils/vulnRiskLevel'

/** 首页漏洞风险三档配色（与 Ant Design 语义色一致） */
export const DASHBOARD_VULN_RISK_LEVEL_COLOR: Record<DashboardVulnRiskLevel, string> =
  VULN_RISK_LEVEL_COLOR

/** 首页漏洞风险三档中文标签 */
export const DASHBOARD_VULN_RISK_LEVEL_LABEL: Record<DashboardVulnRiskLevel, string> =
  VULN_RISK_LEVEL_LABEL

/** 三档展示顺序（环图图例与扇区排序） */
export const DASHBOARD_VULN_RISK_LEVEL_ORDER: DashboardVulnRiskLevel[] = VULN_RISK_LEVEL_ORDER
