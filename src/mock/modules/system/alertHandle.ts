import type { AlertListItem, HandleAlertParams, HandleAlertResult } from '@/types/system'
import { ALERT_DISPOSITION } from '@/types/system'
import { MOCK_ALERT_ASSIGNEE_OPTIONS } from '@/mock/modules/system/alertAssignees'
import {
  getMockAlertDetail,
  getMockAlertsByStatus,
  mutateMockAlertLists,
} from '@/mock/modules/system/alertList'
import {
  appendMockAlertTimelineEntry,
  registerMockAlertTimeline,
} from '@/mock/modules/system/alertTimeline'
import dayjs from 'dayjs'

/**
 * mock 提交告警处置：忽略本次仅标已读；其余转入已处理并写入时间线
 * @param alertId - 告警 ID
 * @param params - 处置参数
 * @param handlerName - 当前操作人姓名
 */
export function mockHandleAlert(
  alertId: string,
  params: HandleAlertParams,
  handlerName: string,
): HandleAlertResult {
  const pending = getMockAlertsByStatus('pending')
  const index = pending.findIndex((item) => item.alertId === alertId)
  if (index < 0) {
    throw new Error('告警不存在或已处理')
  }

  const source = pending[index]
  const detail = getMockAlertDetail(alertId)

  if (params.disposition === ALERT_DISPOSITION.IgnoreOnce) {
    const updated: AlertListItem = {
      ...source,
      isRead: true,
    }
    mutateMockAlertLists({ type: 'update-pending', index, item: updated })
    return { alert: updated, movedToHandled: false }
  }

  const handledItem: AlertListItem = {
    ...source,
    status: 'handled',
    isRead: true,
    handledAt: new Date().toISOString(),
    handlerName,
    disposition: params.disposition,
  }

  mutateMockAlertLists({ type: 'move-to-handled', pendingIndex: index, handledItem })

  registerMockAlertTimeline(
    alertId,
    source.title,
    handlerName,
    detail?.triggerRule ?? 'GENERIC_ALERT',
    params.disposition,
    params.remark,
  )

  const assigneeLabel = MOCK_ALERT_ASSIGNEE_OPTIONS.find(
    (o) => o.userId === params.assigneeUserId,
  )?.label

  if (params.disposition === ALERT_DISPOSITION.TransferReview && assigneeLabel) {
    appendMockAlertTimelineEntry(
      alertId,
      dayjs(handledItem.handledAt).format('YYYY-MM-DD HH:mm'),
      `已向${assigneeLabel}发送站内消息（告警转派待办）`,
    )
  }

  if (params.notifyAuditor) {
    appendMockAlertTimelineEntry(
      alertId,
      dayjs(handledItem.handledAt).add(1, 'minute').format('YYYY-MM-DD HH:mm'),
      '已通知审计员归档',
    )
  }

  return { alert: handledItem, movedToHandled: true }
}
