import type { RouteLocationRaw } from 'vue-router'
import type { SiteMessageAction } from '@/types/siteMessage'

/** 根据消息主操作解析前端路由（不含 from，由调用方 appendFromQuery） */
export function resolveSiteMessageActionRoute(action: SiteMessageAction): RouteLocationRaw {
  switch (action.type) {
    case 'view_task_result':
      if (action.taskType === 'open-source-risk') {
        return { path: `/detect/tasks/${action.taskId ?? ''}/risk` }
      }
      return { path: `/detect/tasks/${action.taskId ?? ''}/result` }
    case 'go_approval':
      return { path: `/policies/${action.policyId ?? ''}/governance` }
    case 'view_alert':
      return { path: '/system/alerts' }
    case 'view_knowledge':
      return { path: '/knowledge' }
    case 'change_password':
      return { path: '/system/profile', query: { tab: 'password' } }
    case 'view_report':
      return { path: '/reports' }
    default: {
      const _exhaustive: never = action.type
      return _exhaustive
    }
  }
}
