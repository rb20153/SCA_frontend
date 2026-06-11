import type { VulnSource, VulnSourceCode, VulnSyncStatus } from '@/types/knowledge'

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

/** 列表空值占位 */
export const VULN_SOURCE_EMPTY_METRIC = '—'

/** 是否为内置漏洞来源（支持立即同步） */
export function isBuiltinVulnSource(source: VulnSource): boolean {
  return source.kind === 'builtin'
}

/**
 * 格式化记录数/高危数展示（千分位）；null 显示 —
 * @param count - 数量
 */
export function formatVulnMetric(count: number | null): string {
  if (count === null) return VULN_SOURCE_EMPTY_METRIC
  return count.toLocaleString('zh-CN')
}

/**
 * 格式化最近同步时间（内置源与离线包统一为日期 + 时间）
 * @param source - 漏洞来源行数据
 */
export function formatVulnSourceLastSync(source: VulnSource): string {
  if (!source.lastSyncedAt) return VULN_SOURCE_EMPTY_METRIC
  return formatVulnSourceSyncTime(source.lastSyncedAt)
}

/**
 * 格式化同步周期；null 显示 —
 * @param syncCycle - 同步周期文案
 */
export function formatVulnSyncCycle(syncCycle: string | null): string {
  return syncCycle ?? VULN_SOURCE_EMPTY_METRIC
}
