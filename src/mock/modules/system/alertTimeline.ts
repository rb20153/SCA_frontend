import type { AlertDisposition, AlertTimeline } from '@/types/system'
import { ALERT_DISPOSITION } from '@/types/system'
import { ALERT_DISPOSITION_LABEL } from '@/utils/alertDisposition'
import dayjs from 'dayjs'

const TIMELINE_BY_ALERT_ID = new Map<string, AlertTimeline>()

/** 为已处理告警注册静态处理时间线 */
export function registerMockAlertTimeline(
  alertId: string,
  title: string,
  handlerName: string,
  triggerRule: string,
  disposition: AlertDisposition,
  dispositionNote?: string,
) {
  const baseTime = dayjs().subtract(4, 'hour')
  const timeline = [
    {
      time: baseTime.subtract(2, 'hour').format('YYYY-MM-DD HH:mm'),
      message: `系统触发告警 ${triggerRule}`,
    },
    {
      time: baseTime.format('YYYY-MM-DD HH:mm'),
      message: `${handlerName} 选择处理方式：${ALERT_DISPOSITION_LABEL[disposition]}`,
    },
  ]

  if (disposition === ALERT_DISPOSITION.AcceptRisk && dispositionNote) {
    timeline.push({
      time: baseTime.add(1, 'minute').format('YYYY-MM-DD HH:mm'),
      message: `已记录接受原因并关闭告警：${dispositionNote}`,
    })
  }

  TIMELINE_BY_ALERT_ID.set(alertId, {
    alertId,
    title,
    handlerName,
    timeline,
  })
}

/** 向已有时间线追加条目（处置提交后） */
export function appendMockAlertTimelineEntry(alertId: string, time: string, message: string) {
  const data = TIMELINE_BY_ALERT_ID.get(alertId)
  if (!data) return
  data.timeline.push({ time, message })
}

/** 获取告警处理时间线 mock */
export function getMockAlertTimeline(alertId: string): AlertTimeline | null {
  return TIMELINE_BY_ALERT_ID.get(alertId) ?? null
}
