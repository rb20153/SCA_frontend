import type { RolePermissionKey, RolePermissionMap } from '@/types/system'

/** 权限 Key 别名（mock 模块内使用） */
export type PermissionKey = RolePermissionKey

export interface PermissionTreeItem {
  key: PermissionKey
  label: string
}

export interface PermissionTreeGroup {
  key: string
  title: string
  children: PermissionTreeItem[]
}

/** 全部权限 Key 列表 */
export const ALL_PERMISSION_KEYS: PermissionKey[] = [
  'menu.home',
  'menu.project',
  'menu.scan',
  'menu.risk',
  'menu.ai',
  'menu.policy',
  'menu.report',
  'menu.kb',
  'menu.sys_user',
  'menu.sys_role',
  'menu.sys_dept',
  'menu.sys_log',
  'menu.sys_alert',
  'menu.sys_msg',
  'menu.sys_profile',
  'op.project_write',
  'op.project_member',
  'op.deliverable',
  'op.task_run',
  'op.result_view',
  'op.risk_scan',
  'op.ai_parse',
  'op.policy_edit',
  'op.policy_approve',
  'op.report_gen',
  'op.report_export',
  'op.kb_write',
  'op.user_manage',
  'op.role_manage',
  'op.dept_manage',
  'op.log_export',
  'op.alert_handle',
]

/** 权限树分组（抽屉展示用） */
export const PERMISSION_TREE_GROUPS: PermissionTreeGroup[] = [
  {
    key: 'menu',
    title: '菜单权限',
    children: [
      { key: 'menu.home', label: '首页' },
      { key: 'menu.project', label: '项目管理' },
      { key: 'menu.scan', label: '自主率检测' },
      { key: 'menu.risk', label: '开源风险检测' },
      { key: 'menu.ai', label: 'AI 辅助分析' },
      { key: 'menu.policy', label: '策略管理' },
      { key: 'menu.report', label: '报告管理' },
      { key: 'menu.kb', label: '知识库管理' },
      { key: 'menu.sys_user', label: '用户列表' },
      { key: 'menu.sys_role', label: '角色管理' },
      { key: 'menu.sys_dept', label: '部门管理' },
      { key: 'menu.sys_log', label: '日志列表' },
      { key: 'menu.sys_alert', label: '告警中心' },
      { key: 'menu.sys_msg', label: '站内消息' },
      { key: 'menu.sys_profile', label: '个人设置' },
    ],
  },
  {
    key: 'op',
    title: '操作权限',
    children: [
      { key: 'op.project_write', label: '项目增删改' },
      { key: 'op.project_member', label: '项目成员管理' },
      { key: 'op.deliverable', label: '交付物上传/拉取' },
      { key: 'op.task_run', label: '创建/运行检测任务' },
      { key: 'op.result_view', label: '查看结果与证据' },
      { key: 'op.risk_scan', label: '风险扫描操作' },
      { key: 'op.ai_parse', label: 'AI 许可证解析' },
      { key: 'op.policy_edit', label: '策略编辑' },
      { key: 'op.policy_approve', label: '策略发布审批' },
      { key: 'op.report_gen', label: '生成报告' },
      { key: 'op.report_export', label: '报告导出' },
      { key: 'op.kb_write', label: '知识库写入' },
      { key: 'op.user_manage', label: '用户管理' },
      { key: 'op.role_manage', label: '角色权限配置' },
      { key: 'op.dept_manage', label: '部门管理' },
      { key: 'op.log_export', label: '日志导出' },
      { key: 'op.alert_handle', label: '告警处理' },
    ],
  },
]

/** 内置角色权限（与 prototype.html ROLE_PERMISSIONS 一致） */
export const BUILTIN_ROLE_PERMISSIONS: Record<string, RolePermissionMap> = {
  admin: {
    'menu.home': true,
    'menu.project': true,
    'menu.scan': true,
    'menu.risk': true,
    'menu.ai': true,
    'menu.policy': true,
    'menu.report': true,
    'menu.kb': true,
    'menu.sys_user': true,
    'menu.sys_role': true,
    'menu.sys_dept': true,
    'menu.sys_log': true,
    'menu.sys_alert': true,
    'menu.sys_msg': true,
    'menu.sys_profile': true,
    'op.project_write': true,
    'op.project_member': true,
    'op.deliverable': true,
    'op.task_run': true,
    'op.result_view': true,
    'op.risk_scan': true,
    'op.ai_parse': true,
    'op.policy_edit': true,
    'op.policy_approve': true,
    'op.report_gen': true,
    'op.report_export': true,
    'op.kb_write': true,
    'op.user_manage': true,
    'op.role_manage': true,
    'op.dept_manage': true,
    'op.log_export': true,
    'op.alert_handle': true,
  },
  auditor: {
    'menu.home': true,
    'menu.project': true,
    'menu.scan': true,
    'menu.risk': true,
    'menu.ai': false,
    'menu.policy': true,
    'menu.report': true,
    'menu.kb': true,
    'menu.sys_user': false,
    'menu.sys_role': false,
    'menu.sys_dept': false,
    'menu.sys_log': true,
    'menu.sys_alert': true,
    'menu.sys_msg': true,
    'menu.sys_profile': true,
    'op.project_write': false,
    'op.project_member': false,
    'op.deliverable': false,
    'op.task_run': false,
    'op.result_view': true,
    'op.risk_scan': false,
    'op.ai_parse': false,
    'op.policy_edit': false,
    'op.policy_approve': true,
    'op.report_gen': false,
    'op.report_export': true,
    'op.kb_write': false,
    'op.user_manage': false,
    'op.role_manage': false,
    'op.dept_manage': false,
    'op.log_export': true,
    'op.alert_handle': true,
  },
  engineer: {
    'menu.home': true,
    'menu.project': true,
    'menu.scan': true,
    'menu.risk': true,
    'menu.ai': true,
    'menu.policy': false,
    'menu.report': true,
    'menu.kb': true,
    'menu.sys_user': false,
    'menu.sys_role': false,
    'menu.sys_dept': false,
    'menu.sys_log': false,
    'menu.sys_alert': false,
    'menu.sys_msg': true,
    'menu.sys_profile': true,
    'op.project_write': true,
    'op.project_member': true,
    'op.deliverable': true,
    'op.task_run': true,
    'op.result_view': true,
    'op.risk_scan': true,
    'op.ai_parse': true,
    'op.policy_edit': false,
    'op.policy_approve': false,
    'op.report_gen': true,
    'op.report_export': true,
    'op.kb_write': true,
    'op.user_manage': false,
    'op.role_manage': false,
    'op.dept_manage': false,
    'op.log_export': false,
    'op.alert_handle': false,
  },
  readonly: {
    'menu.home': true,
    'menu.project': true,
    'menu.scan': true,
    'menu.risk': true,
    'menu.ai': true,
    'menu.policy': false,
    'menu.report': true,
    'menu.kb': false,
    'menu.sys_user': false,
    'menu.sys_role': false,
    'menu.sys_dept': false,
    'menu.sys_log': false,
    'menu.sys_alert': false,
    'menu.sys_msg': true,
    'menu.sys_profile': true,
    'op.project_write': false,
    'op.project_member': false,
    'op.deliverable': false,
    'op.task_run': false,
    'op.result_view': true,
    'op.risk_scan': false,
    'op.ai_parse': false,
    'op.policy_edit': false,
    'op.policy_approve': false,
    'op.report_gen': false,
    'op.report_export': false,
    'op.kb_write': false,
    'op.user_manage': false,
    'op.role_manage': false,
    'op.dept_manage': false,
    'op.log_export': false,
    'op.alert_handle': false,
  },
}

/** 生成全 false 权限表 */
export function createEmptyRolePermissions(): RolePermissionMap {
  return Object.fromEntries(
    ALL_PERMISSION_KEYS.map((key) => [key, false]),
  ) as RolePermissionMap
}

/** 深拷贝权限表 */
export function cloneRolePermissions(source: RolePermissionMap): RolePermissionMap {
  return { ...source }
}

/** 新建自定义角色默认权限：与只读角色一致 */
export function createDefaultCustomRolePermissions(): RolePermissionMap {
  return cloneRolePermissions(BUILTIN_ROLE_PERMISSIONS.readonly)
}

/**
 * 内置只读角色：未勾选的权限项不可再勾选（与原型一致）
 * @param roleCode - 内置角色编码
 * @param permissionKey - 权限 Key
 * @param checked - 当前是否勾选
 */
export function isBuiltinPermissionDisabled(
  roleCode: string,
  permissionKey: RolePermissionKey,
  checked: boolean,
): boolean {
  return roleCode === 'readonly' && !checked
}
