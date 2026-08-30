import type { PageParams, TaskType } from '@/types/common'

/** 站内消息类型 */
export type SiteMessageType =
  | 'task_notice'
  | 'approval_reminder'
  | 'alert_notice'
  | 'system_announcement'
  | 'report_notice'

/** 列表已读状态筛选 */
export type SiteMessageReadFilter = 'all' | 'read' | 'unread'

/** 站内消息主操作类型（决定操作列跳转） */
export type SiteMessageActionType =
  | 'view_task_result'
  | 'view_task_list'
  | 'go_approval'
  | 'open_policy_approval'
  | 'open_report_approval'
  | 'retry_report_download_application'
  | 'download_report'
  | 'view_alert'
  | 'view_knowledge'
  | 'change_password'
  | 'view_report'
  | 'view_announcement'

/** 消息关联跳转参数 */
export interface SiteMessageAction {
  type: SiteMessageActionType
  label: string
  /** 任务通知子类型：自主率 → 结果页；开源风险/SBOM → 风险详情页 */
  taskType?: TaskType
  taskId?: string
  applicationId?: string
  announcementId?: string
  format?: 'pdf' | 'word' | 'html'
  includeEvidenceChain?: boolean
  policyId?: string
  versionId?: string
  reportId?: string
  alertId?: string
}

export type ReportDownloadApplicationStatus = 'pending_review' | 'approved' | 'rejected'

export interface ReportDownloadApplication {
  applicationId: string
  reportId: string
  applicantId: string
  applicantName: string
  reason: string
  format: 'pdf' | 'word' | 'html'
  includeEvidenceChain: boolean
  status: ReportDownloadApplicationStatus
  approvalOpinion: string
  createdAt: string
  processedAt?: string
}

/** 站内消息列表项 */
export interface SiteMessage {
  messageId: string
  type: SiteMessageType
  eventCode?: string
  title: string
  /** 列表摘要（短文案） */
  summary: string
  /** 正文（详情弹窗等场景使用） */
  content: string
  recipientUserId: string
  recipientUsername: string
  createdAt: string
  read: boolean
  /** 类型相关主操作；无则仅标为已读/未读 */
  action: SiteMessageAction | null
}

export interface SiteMessageListFilters {
  type: SiteMessageType | ''
  title: string
  readStatus: SiteMessageReadFilter
}

export interface SiteMessageListQuery extends PageParams {
  recipientUsername: string
  type?: SiteMessageType
  title?: string
  readStatus?: SiteMessageReadFilter
}

export interface UpdateSiteMessageReadParams {
  messageId: string
  read: boolean
}
