/** 漏洞风险三档等级（图表通用） */
export type VulnRiskLevel = 'high' | 'medium' | 'low'

/** 漏洞风险三档低饱和配色 */
export const VULN_RISK_LEVEL_COLOR: Record<VulnRiskLevel, string> = {
  high: '#e88f8f',
  medium: '#e8c979',
  low: '#8fcea0',
}

/** 漏洞风险三档中文标签 */
export const VULN_RISK_LEVEL_LABEL: Record<VulnRiskLevel, string> = {
  high: '高危',
  medium: '中危',
  low: '低危',
}

/** 漏洞风险三档展示顺序 */
export const VULN_RISK_LEVEL_ORDER: VulnRiskLevel[] = ['high', 'medium', 'low']
