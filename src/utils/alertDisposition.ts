import {
  ALERT_DISPOSITION,
  type AlertDisposition,
} from '@/types/system'

/** 告警处理弹窗可提交的处置方式 */
export const ALERT_DISPOSITION_OPTIONS: { value: AlertDisposition; label: string }[] = [
  { value: ALERT_DISPOSITION.AutoRecover, label: '自动恢复' },
  { value: ALERT_DISPOSITION.ManualFix, label: '人工修复' },
  { value: ALERT_DISPOSITION.Close, label: '关闭告警' },
]

export const ALERT_DISPOSITION_LABEL: Record<AlertDisposition, string> = {
  [ALERT_DISPOSITION.AutoRecover]: '自动恢复',
  [ALERT_DISPOSITION.ManualFix]: '人工修复',
  [ALERT_DISPOSITION.Close]: '关闭告警',
}

/** 处置方式是否需要必填备注 */
export function isAlertRemarkRequired(disposition: AlertDisposition): boolean {
  return (
    disposition === ALERT_DISPOSITION.ManualFix ||
    disposition === ALERT_DISPOSITION.Close
  )
}
