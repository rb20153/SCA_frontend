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
  return { ...res, data: null }
}
