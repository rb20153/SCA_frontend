import type { SiteMessageAction } from '@/types/siteMessage'

/** 根据消息主操作解析前端路由路径 */
export function resolveSiteMessageActionRoute(action: SiteMessageAction): string {
  switch (action.type) {
    case 'view_task_result':
      if (action.taskType === 'open-source-risk') {
        return `/detect/tasks/${action.taskId ?? ''}/risk`
      }
      return `/detect/tasks/${action.taskId ?? ''}/result`
    case 'go_approval':
      return `/policies/${action.policyId ?? ''}/governance`
    case 'view_alert':
      return '/system/alerts'
    case 'view_knowledge':
      return '/knowledge'
    case 'change_password':
      return '/system/profile'
    case 'view_report':
      return '/reports'
    default: {
      const _exhaustive: never = action.type
      return _exhaustive
    }
  }
}
