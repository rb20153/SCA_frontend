import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useLayoutStore } from '@/stores/layout'
import { crumbs, resolveBreadcrumbs } from '@/utils/breadcrumb'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/LoginPage.vue'),
    meta: { title: '登录', requiresAuth: false },
  },
  {
    path: '/',
    component: () => import('@/layouts/AdminLayout.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      // ── 首页 ──────────────────────────────────────────────────────────────
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/Dashboard.vue'),
        meta: {
          title: '首页仪表盘',
          breadcrumbs: crumbs('首页', '仪表盘'),
        },
      },

      // ── 项目管理 ──────────────────────────────────────────────────────────
      {
        path: 'projects',
        name: 'ProjectList',
        component: () => import('@/views/project/ProjectList.vue'),
        meta: {
          title: '项目列表',
          breadcrumbs: crumbs('项目管理', '项目列表'),
        },
      },
      {
        path: 'projects/:projectId',
        name: 'ProjectDetail',
        component: () => import('@/views/project/ProjectDetail.vue'),
        meta: {
          title: '项目详情',
          breadcrumbs: crumbs('项目管理', { title: '项目列表', path: '/projects' }, '项目详情'),
        },
      },

      // ── 检测分析 ──────────────────────────────────────────────────────────
      {
        path: 'detect/autonomy',
        name: 'AutonomyDetectTaskList',
        component: () => import('@/views/detect/AutonomyDetectTaskList.vue'),
        meta: {
          title: '自主率检测',
          breadcrumbs: crumbs('检测分析', '自主率检测'),
        },
      },
      {
        path: 'detect/risk',
        name: 'OpenSourceRiskTaskList',
        component: () => import('@/views/detect/OpenSourceRiskTaskList.vue'),
        meta: {
          title: '开源风险检测',
          breadcrumbs: crumbs('检测分析', '开源风险检测'),
        },
      },
      {
        path: 'detect/autonomy/:taskId/result',
        name: 'AutonomyDetectResult',
        component: () => import('@/views/detect/AutonomyDetectResult.vue'),
        meta: {
          title: '自主率检测结果',
          breadcrumbs: crumbs(
            '检测分析',
            { title: '自主率检测', path: '/detect/autonomy' },
            '检测结果',
          ),
        },
      },
      {
        path: 'detect/risk/:taskId',
        name: 'OpenSourceRiskDetail',
        component: () => import('@/views/detect/OpenSourceRiskDetail.vue'),
        meta: {
          title: '开源风险检测结果',
          breadcrumbs: crumbs(
            '检测分析',
            { title: '开源风险检测', path: '/detect/risk' },
            '检测结果',
          ),
        },
      },
      {
        path: 'detect/tasks',
        redirect: '/detect/autonomy',
      },
      {
        path: 'detect/tasks/:taskId/result',
        redirect: (to) => ({
          path: `/detect/autonomy/${String(to.params.taskId)}/result`,
        }),
      },
      {
        path: 'detect/tasks/:taskId/risk',
        redirect: (to) => ({
          path: `/detect/risk/${String(to.params.taskId)}`,
        }),
      },
      {
        path: 'detect/ai-analysis',
        name: 'AiAnalysis',
        component: () => import('@/views/detect/AiAnalysis.vue'),
        meta: {
          title: 'AI辅助分析',
          breadcrumbs: crumbs('检测分析', 'AI辅助分析'),
        },
      },

      // ── 策略管理 ──────────────────────────────────────────────────────────
      {
        path: 'policies',
        name: 'PolicyList',
        component: () => import('@/views/policy/PolicyList.vue'),
        meta: {
          title: '策略列表',
          breadcrumbs: crumbs('策略管理', '策略列表'),
        },
      },
      {
        path: 'policies/:policyId/edit',
        name: 'PolicyEditor',
        component: () => import('@/views/policy/PolicyEditor.vue'),
        meta: {
          title: '策略编辑器',
          breadcrumbs: crumbs('策略管理', { title: '策略列表', path: '/policies' }, '策略编辑器'),
        },
      },
      {
        path: 'policies/:policyId/governance',
        name: 'PolicyGovernance',
        component: () => import('@/views/policy/PolicyGovernance.vue'),
        meta: {
          title: '版本与审批',
          breadcrumbs: crumbs('策略管理', { title: '策略列表', path: '/policies' }, '版本与审批'),
        },
      },
      {
        path: 'policies/:policyId/trace',
        name: 'PolicyRuleTrace',
        component: () => import('@/views/policy/PolicyRuleTrace.vue'),
        meta: {
          title: '规则命中追溯',
          breadcrumbs: crumbs('策略管理', { title: '策略列表', path: '/policies' }, '规则命中追溯'),
        },
      },

      // ── 报告管理 ──────────────────────────────────────────────────────────
      {
        path: 'reports',
        name: 'ReportList',
        component: () => import('@/views/report/ReportList.vue'),
        meta: {
          title: '报告列表',
          breadcrumbs: crumbs('报告管理', '报告列表'),
        },
      },
      {
        path: 'reports/templates',
        name: 'ReportTemplate',
        component: () => import('@/views/report/ReportTemplate.vue'),
        meta: {
          title: '报告模板',
          breadcrumbs: crumbs('报告管理', '报告模板'),
        },
      },
      {
        path: 'reports/templates/:templateId/edit',
        name: 'ReportTemplateEditor',
        component: () => import('@/views/report/ReportTemplateEditor.vue'),
        meta: {
          title: '编辑模板',
          breadcrumbs: crumbs(
            '报告管理',
            { title: '报告模板', path: '/reports/templates' },
            '编辑模板',
          ),
        },
      },

      // ── 知识库管理 ────────────────────────────────────────────────────────
      {
        path: 'knowledge',
        name: 'KnowledgeBaseList',
        component: () => import('@/views/knowledge/KnowledgeBaseList.vue'),
        meta: {
          title: '知识库管理',
          breadcrumbs: crumbs('知识库管理'),
        },
      },
      {
        path: 'knowledge/coverage',
        name: 'KnowledgeCoverage',
        component: () => import('@/views/knowledge/KnowledgeCoverage.vue'),
        meta: {
          title: '覆盖统计',
          breadcrumbs: crumbs({ title: '知识库管理', path: '/knowledge' }, '覆盖统计'),
        },
      },
      {
        path: 'knowledge/vulnerabilities',
        name: 'VulnKnowledgeBase',
        component: () => import('@/views/knowledge/VulnKnowledgeBase.vue'),
        meta: {
          title: '漏洞知识库',
          breadcrumbs: crumbs({ title: '知识库管理', path: '/knowledge' }, '漏洞知识库'),
        },
      },
      {
        path: 'knowledge/quarter-updates',
        name: 'KbQuarterUpdateManage',
        component: () => import('@/views/knowledge/KbQuarterUpdateManage.vue'),
        meta: {
          title: '季度更新管理',
          breadcrumbs: crumbs({ title: '知识库管理', path: '/knowledge' }, '季度更新管理'),
        },
      },
      {
        path: 'knowledge/vulnerabilities/items',
        name: 'VulnItemList',
        component: () => import('@/views/knowledge/VulnItemList.vue'),
        meta: {
          title: '漏洞条目',
          breadcrumbs: crumbs(
            { title: '知识库管理', path: '/knowledge' },
            { title: '漏洞知识库', path: '/knowledge/vulnerabilities' },
            '漏洞条目',
          ),
        },
      },
      {
        path: 'knowledge/:kbProjectId/versions',
        name: 'KbVersionManage',
        component: () => import('@/views/knowledge/KbVersionManage.vue'),
        meta: {
          title: '版本管理',
          breadcrumbs: crumbs({ title: '知识库管理', path: '/knowledge' }, '版本管理'),
        },
      },
      {
        path: 'knowledge/:kbProjectId/directory',
        name: 'KbProjectDirectory',
        component: () => import('@/views/knowledge/KbProjectDirectory.vue'),
        meta: {
          title: '项目目录',
          breadcrumbs: crumbs({ title: '知识库管理', path: '/knowledge' }, '项目目录'),
        },
      },

      // ── 系统管理 ──────────────────────────────────────────────────────────
      {
        path: 'system/users',
        name: 'UserList',
        component: () => import('@/views/system/UserList.vue'),
        meta: {
          title: '用户列表',
          breadcrumbs: crumbs('系统管理', '用户列表'),
        },
      },
      {
        path: 'system/roles',
        name: 'RoleManage',
        component: () => import('@/views/system/RoleManage.vue'),
        meta: {
          title: '角色管理',
          breadcrumbs: crumbs('系统管理', '角色管理'),
        },
      },
      {
        path: 'system/departments',
        name: 'DepartmentManage',
        component: () => import('@/views/system/DepartmentManage.vue'),
        meta: {
          title: '部门管理',
          breadcrumbs: crumbs('系统管理', '部门管理'),
        },
      },
      {
        path: 'system/logs',
        name: 'LogList',
        component: () => import('@/views/system/LogList.vue'),
        meta: {
          title: '日志列表',
          breadcrumbs: crumbs('系统管理', '日志列表'),
        },
      },
      {
        path: 'system/alerts',
        name: 'AlertCenter',
        component: () => import('@/views/system/AlertCenter.vue'),
        meta: {
          title: '告警中心',
          breadcrumbs: crumbs('系统管理', '告警中心'),
        },
      },
      {
        path: 'system/messages',
        name: 'SiteMessage',
        component: () => import('@/views/system/SiteMessage.vue'),
        meta: {
          title: '站内消息',
          breadcrumbs: crumbs('系统管理', '站内消息'),
        },
      },
      {
        path: 'system/profile',
        name: 'UserProfile',
        component: () => import('@/views/system/UserProfile.vue'),
        meta: {
          title: '个人设置',
          breadcrumbs: crumbs('系统管理', '个人设置'),
        },
      },
    ],
  },
  // 404
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

// ─── Route transition loading ─────────────────────────────────────────────────
router.beforeEach((to, from) => {
  if (to.path !== from.path) {
    useLayoutStore().setPageLoading(true)
  }
})

// ─── Navigation guard ─────────────────────────────────────────────────────────
router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  const requiresAuth = to.meta.requiresAuth !== false

  if (requiresAuth && !authStore.isLoggedIn) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  // token 在 localStorage（记住我）或 sessionStorage 中，Pinia 刷新后会丢失 userInfo，此处补拉一次
  if (authStore.isLoggedIn && !authStore.userInfo) {
    try {
      await authStore.fetchUserInfo()
    } catch {
      authStore.logout()
      if (requiresAuth) {
        return { path: '/login', query: { redirect: to.fullPath } }
      }
    }
  }

  if (to.path === '/login' && authStore.isLoggedIn) {
    return { path: '/dashboard' }
  }

  document.title = to.meta.title ? `${to.meta.title} — SCA检测平台` : 'SCA检测平台'
})

/** 路由切换后根据 meta.breadcrumbs 自动更新顶栏面包屑 */
router.afterEach((to) => {
  useLayoutStore().setPageLoading(false)

  if (to.meta.requiresAuth === false) return
  const layoutStore = useLayoutStore()
  layoutStore.setBreadcrumbs(resolveBreadcrumbs(to))
})

/** 路由加载失败时关闭 loading，避免遮罩常驻 */
router.onError(() => {
  useLayoutStore().setPageLoading(false)
})

export default router
