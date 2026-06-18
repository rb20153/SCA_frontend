import {
  ALERT_DISPOSITION,
  type AlertDisposition,
} from '@/types/system'

/** 处置方式下拉选项 */
export const ALERT_DISPOSITION_OPTIONS: { value: AlertDisposition; label: string }[] = [
  { value: ALERT_DISPOSITION.AutoRecover, label: '自动恢复' },
  { value: ALERT_DISPOSITION.ManualFix, label: '人工修复' },
  { value: ALERT_DISPOSITION.TransferReview, label: '转派复核' },
  { value: ALERT_DISPOSITION.TempMitigate, label: '临时缓解' },
  { value: ALERT_DISPOSITION.AcceptRisk, label: '接受风险' },
  { value: ALERT_DISPOSITION.FalsePositive, label: '误报关闭' },
  { value: ALERT_DISPOSITION.IgnoreOnce, label: '忽略本次' },
]

export const ALERT_DISPOSITION_LABEL: Record<AlertDisposition, string> = {
  [ALERT_DISPOSITION.AutoRecover]: '自动恢复',
  [ALERT_DISPOSITION.ManualFix]: '人工修复',
  [ALERT_DISPOSITION.TransferReview]: '转派复核',
  [ALERT_DISPOSITION.TempMitigate]: '临时缓解',
  [ALERT_DISPOSITION.AcceptRisk]: '接受风险',
  [ALERT_DISPOSITION.FalsePositive]: '误报关闭',
  [ALERT_DISPOSITION.IgnoreOnce]: '忽略本次',
}

export interface DispositionFollowUpBlock {
  paragraphs: string[]
}

/**
 * 根据处置方式与关联任务名生成「后续动作」预览文案（对齐原型 conditional-panel）
 * @param disposition - 处置方式
 * @param relatedTaskName - 关联任务名，无则回退为「关联任务」
 */
export function getAlertDispositionFollowUp(
  disposition: AlertDisposition,
  relatedTaskName?: string,
): DispositionFollowUpBlock | null {
  const taskLabel = relatedTaskName ?? '关联任务'

  switch (disposition) {
    case ALERT_DISPOSITION.AutoRecover:
      return {
        paragraphs: [
          `系统将重启指纹服务并重试关联任务「${taskLabel}」。`,
          '告警终态：执行成功后自动关闭并写入审计日志。',
        ],
      }
    case ALERT_DISPOSITION.ManualFix:
      return {
        paragraphs: [
          '修复配置/环境后，从检查点 task-20260519-001.ckpt 续扫。',
          '告警终态：人工确认修复完成后关闭。',
          '需填写处理说明。',
        ],
      }
    case ALERT_DISPOSITION.TransferReview:
      return {
        paragraphs: [
          '提交检测工程师进一步排查。',
          '告警终态：记录处置后转入已处理；若需继续跟进由被指派人处理关联任务。',
        ],
      }
    case ALERT_DISPOSITION.TempMitigate:
      return {
        paragraphs: [
          '切换备用 Worker 节点继续执行当前任务。',
          '告警终态：缓解成功后观察一段时间再关闭。',
        ],
      }
    case ALERT_DISPOSITION.AcceptRisk:
      return {
        paragraphs: [
          '记录接受原因并归档，不再重复告警。',
          '告警终态：立即关闭。',
          '接受原因必填。',
        ],
      }
    case ALERT_DISPOSITION.FalsePositive:
      return {
        paragraphs: [
          '标记为规则误判，反馈给策略引擎优化规则。',
          '告警终态：立即关闭。',
        ],
      }
    case ALERT_DISPOSITION.IgnoreOnce:
      return {
        paragraphs: [
          '仅标记本条告警为已读，不触发任何系统动作。',
          '告警终态：保持未处理。',
          '等同于列表「忽略本次」，不发送站内消息。',
        ],
      }
    default:
      return null
  }
}

/** 处置方式是否需要必填备注 */
export function isAlertRemarkRequired(disposition: AlertDisposition): boolean {
  return (
    disposition === ALERT_DISPOSITION.ManualFix ||
    disposition === ALERT_DISPOSITION.AcceptRisk
  )
}

/** 关闭类处置（可选通知审计员） */
export function isAlertCloseDisposition(disposition: AlertDisposition): boolean {
  return (
    disposition === ALERT_DISPOSITION.AcceptRisk ||
    disposition === ALERT_DISPOSITION.FalsePositive
  )
}
