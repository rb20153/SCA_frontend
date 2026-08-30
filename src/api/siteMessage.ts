import request from '@/utils/request'
import type { ApiResponse, PageResult } from '@/types/common'
import type {
  SiteMessage,
  SiteMessageListQuery,
  UpdateSiteMessageReadParams,
} from '@/types/siteMessage'
import {
  normalizeMarkAllReadResult,
  normalizeSiteMessagePage,
  siteMessageQueryToApi,
} from '@/utils/siteMessageAdapter'

const SITE_MESSAGE_STATUS_EVENT = 'site-message-status-changed'

function notifySiteMessageStatusChanged(): void {
  window.dispatchEvent(new Event(SITE_MESSAGE_STATUS_EVENT))
}

export { SITE_MESSAGE_STATUS_EVENT }

/** 获取当前用户未读站内消息数，用于顶栏角标。 */
export async function getSiteMessageUnreadCount(
  recipientUsername = '',
): Promise<ApiResponse<{ count: number }>> {
  try {
    const res = await request.get<ApiResponse<{ count?: number; unreadCount?: number }>>(
      '/api/system/messages/unread-count',
      { silent: true },
    )
    return { ...res, data: { count: Number(res.data?.count ?? res.data?.unreadCount ?? 0) } }
  } catch (error) {
    const status = (error as { response?: { status?: number } })?.response?.status
    if (status !== 404 && status !== 405) {
      throw error
    }

    // 旧后端尚未提供 unread-count 时，继续使用原消息列表接口维持顶栏可用。
    const legacy = await getSiteMessageList({
      recipientUsername,
      page: 1,
      pageSize: 100,
      readStatus: 'unread',
    })
    return { ...legacy, data: { count: legacy.data.total ?? legacy.data.list.length } }
  }
}

export interface PublishSystemAnnouncementParams {
  title: string
  content: string
  audienceType: 'all' | 'role' | 'department'
  audienceIds: string[]
}
/** 仅管理员可发布；后端按接收范围生成 system.announcement 消息。 */
export async function publishSystemAnnouncement(params: PublishSystemAnnouncementParams): Promise<ApiResponse<null>> {
  const response = await request.post<ApiResponse<null>>('/api/system/announcements', params)
  notifySiteMessageStatusChanged()
  return response
}

/**
 * 分页查询当前用户的站内消息（按时间倒序）
 * @param params - 接收人用户名、筛选条件、分页
 */
export async function getSiteMessageList(
  params: SiteMessageListQuery,
): Promise<ApiResponse<PageResult<SiteMessage>>> {
  const res = await request.get<ApiResponse<unknown>>('/api/system/messages', {
    params: siteMessageQueryToApi(params),
  })
  return { ...res, data: normalizeSiteMessagePage(res.data ?? res) }
}

/**
 * 将当前用户全部站内消息标为已读
 * @param recipientUsername - 当前登录用户名
 * 后端以 token 中的用户为准，body 里的 recipientUsername 仅作冗余参数
 */
export async function markAllSiteMessagesRead(
  recipientUsername: string,
): Promise<ApiResponse<{ updatedCount: number }>> {
  const res = await request.post<ApiResponse<unknown>>('/api/system/messages/read-all', {
    recipientUsername,
  })
  notifySiteMessageStatusChanged()
  return { ...res, data: normalizeMarkAllReadResult(res.data) }
}

/**
 * 更新单条站内消息已读状态
 * @param params - 消息 ID 与 read 目标值
 */
export async function updateSiteMessageReadStatus(
  params: UpdateSiteMessageReadParams,
): Promise<ApiResponse<null>> {
  const res = await request.patch<ApiResponse<unknown>>(
    `/api/system/messages/${params.messageId}/read`,
    { read: params.read },
  )
  notifySiteMessageStatusChanged()
  return { ...res, data: null }
}
