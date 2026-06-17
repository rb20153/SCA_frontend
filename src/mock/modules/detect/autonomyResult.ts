import type { AutonomyDetectResultOverview } from '@/types/detect'
import { MOCK_ALL_DETECT_TASKS } from '@/mock/modules/detect/taskList'

/** 自主率样本：覆盖 绿(≥80) / 黄(50–80) / 红(<50) 三档，便于验证配色 */
const RATE_SAMPLES = [92.4, 87.6, 76.3, 64.8, 48.2]

/**
 * mock：按任务 ID 派生自主率检测结果总体摘要
 * 优先复用任务列表已有的自主率字段，缺失时按序号回退到样本值，保证三档配色都能看到
 * @param taskId - 检测任务 ID
 */
export function getMockAutonomyDetectResultOverview(
  taskId: string,
): AutonomyDetectResultOverview {
  const task = MOCK_ALL_DETECT_TASKS.find((t) => t.taskId === taskId)
  const seq = Number.parseInt(taskId.replace(/\D/g, ''), 10) || 1

  const total = task?.totalAutonomyRate ?? RATE_SAMPLES[seq % RATE_SAMPLES.length]
  // 风险自主率通常略低于总体自主率
  const risk = task?.riskAutonomyRate ?? Math.max(0, Math.round((total - 6.2) * 10) / 10)

  return {
    taskId,
    taskName: task?.taskName ?? `检测任务-${seq}`,
    projectName: task?.projectName ?? '未知项目',
    status: task?.status ?? 'success',
    finishedAt: task?.finishedAt ?? '2026-05-28 16:42:10',
    totalAutonomyRate: total,
    riskAutonomyRate: risk,
    issueFileCount: 12 + (seq % 5) * 3,
    codeIssueCount: 30 + (seq % 7) * 4,
    fingerprintIssueCount: 6 + (seq % 4) * 2,
  }
}
