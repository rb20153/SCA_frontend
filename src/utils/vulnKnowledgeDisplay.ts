import type { VulnSourceCode, VulnSyncStatus } from '@/types/knowledge'

/** 漏洞来源列表横向滚动宽度 */
export const VULN_SOURCE_TABLE_SCROLL_X = 1120

export const VULN_SOURCE_CODE_LABEL: Record<VulnSourceCode, string> = {
  nvd: 'NVD',
  cnvd: 'CNVD',
  osv: 'OSV',
  github_advisory: 'GitHub Advisory',
}

export const VULN_SYNC_STATUS_LABEL: Record<VulnSyncStatus, string> = {
  normal: '正常',
  delayed: '延迟',
  warning: '警告',
}

export const VULN_SYNC_STATUS_COLOR: Record<VulnSyncStatus, string> = {
  normal: 'success',
  delayed: 'warning',
  warning: 'error',
}

/**
 * 格式化漏洞来源最近同步时间
 * @param iso - ISO 8601 时间字符串
 */
export function formatVulnSourceSyncTime(iso: string): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso

  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/**
 * 格式化记录数/高危数展示（千分位）
 * @param count - 数量
 */
export function formatVulnCount(count: number): string {
  return count.toLocaleString('zh-CN')
}
