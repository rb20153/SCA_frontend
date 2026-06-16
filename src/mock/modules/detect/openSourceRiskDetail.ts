import type { OpenSourceRiskDetailSummary } from '@/types/detect'
import { getMockOpenSourceRiskIgnoredComponentCount } from '@/mock/modules/detect/openSourceRiskComponents'

/**
 * mock：按任务 ID 返回开源风险详情统计摘要
 * @param taskId - 检测任务 ID
 */
export function getMockOpenSourceRiskDetailSummary(
  taskId: string,
): OpenSourceRiskDetailSummary {
  const seq = Number.parseInt(taskId.replace(/\D/g, ''), 10) || 1
  const base = 120 + (seq % 7) * 12
  const ignoredCount = getMockOpenSourceRiskIgnoredComponentCount(taskId)

  return {
    identifiedComponentCount: base + 36 - ignoredCount,
    highRiskVulnCount: 3 + (seq % 4),
    pendingCount: 8 + (seq % 6),
    licenseRiskCount: 2 + (seq % 3),
  }
}
