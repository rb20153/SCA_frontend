import type { MessageNotifyPreferences } from '@/types/profile'

/** 消息偏好勾选项配置（顺序与原型一致） */
export const NOTIFY_PREFERENCE_OPTIONS: Array<{
  key: keyof MessageNotifyPreferences
  label: string
}> = [
  { key: 'taskComplete', label: '任务完成通知' },
  { key: 'approvalReminder', label: '策略审批提醒' },
  { key: 'alertSummary', label: '告警摘要推送' },
  { key: 'reportNotice', label: '报告生成通知' },
  { key: 'systemAnnouncement', label: '系统公告' },
]

/**
 * 校验个人设置修改密码规则：至少 8 位，含大小写字母与数字
 * @param password - 新密码明文
 */
export function isValidProfilePassword(password: string): boolean {
  if (password.length < 8) return false
  if (!/[a-z]/.test(password)) return false
  if (!/[A-Z]/.test(password)) return false
  if (!/\d/.test(password)) return false
  return true
}

/** 创建默认消息偏好（全部开启，系统公告关闭） */
export function createDefaultNotifyPreferences(): MessageNotifyPreferences {
  return {
    taskComplete: true,
    approvalReminder: true,
    alertSummary: true,
    reportNotice: true,
    systemAnnouncement: false,
  }
}
