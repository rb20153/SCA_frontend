import dayjs from 'dayjs'
import type { SiteMessageReadFilter, SiteMessageType } from '@/types/siteMessage'

export const SITE_MESSAGE_TYPE_LABEL: Record<SiteMessageType, string> = {
  task_notice: '任务通知',
  approval_reminder: '审批提醒',
  alert_notice: '告警摘要',
  system_announcement: '系统公告',
  report_notice: '报告通知',
}

export const SITE_MESSAGE_TYPE_COLOR: Record<SiteMessageType, string> = {
  task_notice: 'processing',
  approval_reminder: 'warning',
  alert_notice: 'error',
  system_announcement: 'blue',
  report_notice: 'success',
}

/** 消息类型筛选下拉（含全部） */
export const SITE_MESSAGE_TYPE_FILTER_OPTIONS: Array<{
  label: string
  value: SiteMessageType | ''
}> = [
  { label: '全部类型', value: '' },
  { label: '任务通知', value: 'task_notice' },
  { label: '审批提醒', value: 'approval_reminder' },
  { label: '告警摘要', value: 'alert_notice' },
  { label: '系统公告', value: 'system_announcement' },
  { label: '报告通知', value: 'report_notice' },
]

/** 已读状态筛选下拉 */
export const SITE_MESSAGE_READ_FILTER_OPTIONS: Array<{
  label: string
  value: SiteMessageReadFilter
}> = [
  { label: '全部状态', value: 'all' },
  { label: '已读', value: 'read' },
  { label: '未读', value: 'unread' },
]

/** 站内消息列表表格横向滚动宽度 */
export const SITE_MESSAGE_TABLE_SCROLL_X = 1080

/**
 * 格式化消息时间为列表展示（日期 + 时间）
 * @param value - ISO 8601 字符串
 */
export function formatSiteMessageDateTime(value: string): string {
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm:ss') : '—'
}
