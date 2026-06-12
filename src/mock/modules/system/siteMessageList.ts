/** 站内消息类型 */
export type SiteMessageType = 'system_announcement' | 'task_notice' | 'alert_notice'

/** 站内消息 mock 实体 */
export interface SiteMessage {
  messageId: string
  type: SiteMessageType
  title: string
  content: string
  /** 接收用户 ID */
  recipientUserId: string
  /** 接收用户名（展示用） */
  recipientUsername: string
  createdAt: string
  read: boolean
}

const SITE_MESSAGE_SEEDS: SiteMessage[] = [
  {
    messageId: 'msg-001',
    type: 'system_announcement',
    title: '平台维护通知',
    content: '系统将于 2026-06-15 02:00–04:00 进行例行维护，期间检测任务可能短暂不可用。',
    recipientUserId: 'user-001',
    recipientUsername: 'admin',
    createdAt: '2026-06-10T09:00:00+08:00',
    read: true,
  },
  {
    messageId: 'msg-002',
    type: 'task_notice',
    title: '检测任务已完成',
    content: '项目「飞控仿真V2」自主率检测任务已完成，可前往结果页查看。',
    recipientUserId: 'user-002',
    recipientUsername: 'zhangsan',
    createdAt: '2026-06-11T14:30:00+08:00',
    read: false,
  },
]

/** 运行时可追加的站内消息列表 */
export const MOCK_ALL_SITE_MESSAGES: SiteMessage[] = [...SITE_MESSAGE_SEEDS]

let nextMessageSeq = SITE_MESSAGE_SEEDS.length + 1

/**
 * 追加密码重置系统公告（管理员重置用户密码后通知该用户）
 * @param userId - 接收用户 ID
 * @param username - 接收用户名
 * @param tempPassword - 临时密码
 */
export function appendPasswordResetSiteMessage(
  userId: string,
  username: string,
  tempPassword: string,
): SiteMessage {
  const message: SiteMessage = {
    messageId: `msg-${String(nextMessageSeq).padStart(3, '0')}`,
    type: 'system_announcement',
    title: '密码已重置',
    content: `您的账号密码已由管理员重置。临时密码为：${tempPassword}，请尽快前往个人设置修改密码。`,
    recipientUserId: userId,
    recipientUsername: username,
    createdAt: new Date().toISOString(),
    read: false,
  }
  nextMessageSeq += 1
  MOCK_ALL_SITE_MESSAGES.unshift(message)
  return message
}
