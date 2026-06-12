import type { ApiResponse, PageResult } from '@/types/common'
import type {
  SiteMessage,
  SiteMessageListQuery,
  UpdateSiteMessageReadParams,
} from '@/types/siteMessage'
import {
  filterMockSiteMessageList,
  markAllMockSiteMessagesRead,
  updateMockSiteMessageRead,
} from '@/mock/modules/system/siteMessageList'

/**
 * 分页查询当前用户的站内消息（按时间倒序）
 * @param params - 接收人用户名、筛选条件、分页
 */
export function getSiteMessageList(
  params: SiteMessageListQuery,
): Promise<ApiResponse<PageResult<SiteMessage>>> {
  // TODO: replace with → return request.get('/api/system/messages', { params })
  return Promise.resolve({
    code: 200,
    message: 'ok',
    data: filterMockSiteMessageList(params),
  })
}

/**
 * 将当前用户全部站内消息标为已读
 * @param recipientUsername - 当前登录用户名
 */
export function markAllSiteMessagesRead(
  recipientUsername: string,
): Promise<ApiResponse<{ updatedCount: number }>> {
  // TODO: replace with → return request.post('/api/system/messages/read-all')
  const updatedCount = markAllMockSiteMessagesRead(recipientUsername)
  return Promise.resolve({
    code: 200,
    message: 'ok',
    data: { updatedCount },
  })
}

/**
 * 更新单条站内消息已读状态
 * @param params - 消息 ID 与 read 目标值
 */
export function updateSiteMessageReadStatus(
  params: UpdateSiteMessageReadParams,
): Promise<ApiResponse<null>> {
  // TODO: replace with → return request.patch(`/api/system/messages/${params.messageId}/read`, { read: params.read })
  const ok = updateMockSiteMessageRead(params)
  if (!ok) {
    return Promise.reject(new Error('消息不存在'))
  }
  return Promise.resolve({ code: 200, message: 'ok', data: null })
}
