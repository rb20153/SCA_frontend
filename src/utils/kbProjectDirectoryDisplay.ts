import { formatKbProjectDateTime } from '@/utils/knowledgeDisplay'

/**
 * 将来源候选列表格式化为单行展示（中文分号分隔）
 * @param candidates - 来源候选名称列表
 */
export function formatKbProjectSourceCandidates(candidates: string[]): string {
  if (candidates.length === 0) {
    return '—'
  }
  return candidates.join('；')
}

/**
 * 格式化文件最近更新行：日期时间 + 写入情况
 * @param updatedAt - ISO 8601 时间
 * @param writeContext - 写入任务说明
 */
export function formatKbProjectFileUpdatedLine(updatedAt: string, writeContext: string): string {
  const timeLabel = formatKbProjectDateTime(updatedAt)
  if (!writeContext) {
    return timeLabel
  }
  return `${timeLabel} · ${writeContext}`
}

/**
 * 置信度保留两位小数
 * @param value - 0–1 置信度
 */
export function formatKbProjectConfidence(value: number): string {
  return value.toFixed(2)
}
