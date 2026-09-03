import type { RouteLocationRaw } from 'vue-router'
import type { SiteMessageAction } from '@/types/siteMessage'

import {
  getAutonomyDetectResultPath,
  getOpenSourceRiskDetailPath,
} from '@/utils/taskDisplay'

/**
 * 校验消息动作能否安全执行。关联对象缺失时停留当前页，避免路由落到空 ID 的详情页。
 */
export function getSiteMessageActionValidationError(action: SiteMessageAction): string | null {
  switch (action.type) {
    case 'view_task_result':
    case 'view_task_list':
      return action.traceId || (action.taskId && action.taskType)
        ? null
        : '缺少关联任务信息，暂时无法跳转'
    case 'go_approval':
      return action.policyId ? null : '缺少关联策略信息，暂时无法跳转'
    case 'open_policy_approval':
      return action.policyId && action.versionId ? null : '缺少策略审批关联信息'
    case 'open_report_approval':
      return action.reportId && action.applicationId ? null : '缺少报告审批申请信息'
    case 'retry_report_download_application':
      return action.reportId ? null : '缺少关联报告信息，暂时无法重新申请'
    case 'download_report':
      return action.reportId && action.applicationId ? null : '缺少已审批下载信息，暂时无法下载'
    case 'view_alert':
      return action.alertId ? null : '缺少关联告警信息，暂时无法跳转'
    case 'view_report':
      return action.reportId ? null : '缺少关联报告信息，暂时无法跳转'
    case 'view_announcement':
      return action.announcementId ? null : '缺少公告信息，暂时无法查看'
    case 'view_knowledge':
    case 'change_password':
      return null
    default: {
      const _exhaustive: never = action.type
      return _exhaustive
    }
  }
}

/** 根据消息主操作解析前端路由（不含 from，由调用方 appendFromQuery） */
export function resolveSiteMessageActionRoute(action: SiteMessageAction): RouteLocationRaw {
  switch (action.type) {
    case 'view_task_result':
      if (action.taskType === 'open-source-risk') {
        return { path: getOpenSourceRiskDetailPath(action.taskId ?? '') }
      }
      return { path: getAutonomyDetectResultPath(action.taskId ?? '') }
    case 'view_task_list':
      if (action.traceId) {
        return { path: '/system/logs', query: { traceId: action.traceId } }
      }
      return {
        path: action.taskType === 'open-source-risk'
          ? '/detect/risk'
          : action.taskType === 'autonomy'
            ? '/detect/autonomy'
            : '/detect/ai-analysis',
        query: action.taskId ? { taskId: action.taskId } : undefined,
      }
    case 'go_approval':
      return { path: `/policies/${action.policyId ?? ''}/governance` }
    case 'open_policy_approval':
      return {
        path: `/policies/${action.policyId ?? ''}/governance`,
        query: { approvalVersionId: action.versionId ?? '' },
      }
    case 'open_report_approval':
      return { path: '/reports', query: { approvalId: action.applicationId ?? '', reportId: action.reportId ?? '' } }
    case 'retry_report_download_application':
      return { path: '/reports', query: { reportId: action.reportId ?? '', retryApplication: '1' } }
    case 'download_report':
      return { path: '/reports', query: { reportId: action.reportId ?? '', downloadApplication: action.applicationId ?? '', format: action.format ?? 'pdf', includeEvidenceChain: String(action.includeEvidenceChain ?? false) } }
    case 'view_alert':
      return {
        path: '/system/alerts',
        query: action.alertId ? { alertId: action.alertId } : undefined,
      }
    case 'view_knowledge':
      return { path: '/knowledge' }
    case 'change_password':
      return { path: '/system/profile', query: { tab: 'password' } }
    case 'view_report':
      return { path: '/reports', query: action.reportId ? { id: action.reportId } : undefined }
    case 'view_announcement':
      return { path: '/system/messages', query: { announcementId: action.announcementId ?? '' } }
    default: {
      const _exhaustive: never = action.type
      return _exhaustive
    }
  }
}
