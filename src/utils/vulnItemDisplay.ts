import type { VulnItemLevel, VulnItemStatus } from '@/types/knowledge'

export const VULN_ITEM_TABLE_SCROLL_X = 1080

export const VULN_ITEM_LEVEL_LABEL: Record<VulnItemLevel, string> = {
  low: '低',
  medium: '中',
  high: '高',
}

export const VULN_ITEM_LEVEL_COLOR: Record<VulnItemLevel, string> = {
  low: 'default',
  medium: 'warning',
  high: 'error',
}

export const VULN_ITEM_STATUS_LABEL: Record<VulnItemStatus, string> = {
  synced: '已同步',
  needs_review: '需复核',
  pending_action: '待处置',
}

export const VULN_ITEM_STATUS_COLOR: Record<VulnItemStatus, string> = {
  synced: 'success',
  needs_review: 'error',
  pending_action: 'warning',
}

/**
 * 格式化漏洞条目更新时间（列表 / 详情）
 * @param iso - ISO 8601 时间字符串
 */
export function formatVulnItemDateTime(iso: string): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso

  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/**
 * 将参考链接列表格式化为详情展示文案
 * @param links - 参考链接数组
 */
export function formatVulnItemReferenceLinks(links: string[]): string {
  if (links.length === 0) return '—'
  return links.join(' / ')
}
