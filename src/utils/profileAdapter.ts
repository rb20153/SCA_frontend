import type {
  ChangeUserPasswordParams,
  MessageNotifyPreferences,
  UpdateUserProfileParams,
  UserProfile,
  UserProfileDetail,
} from '@/types/profile'
import { createDefaultNotifyPreferences } from '@/utils/profileDisplay'
import { normalizeDepartmentOptionList } from '@/utils/userAdapter'

/** 取第一个非空字符串 */
function pickFirstNonEmptyString(...candidates: unknown[]): string {
  for (const candidate of candidates) {
    const text = String(candidate ?? '').trim()
    if (text) {
      return text
    }
  }
  return ''
}

/** 规范布尔值（兼容 0/1、字符串 true/false） */
function normalizeBoolean(raw: unknown, fallback: boolean): boolean {
  if (raw === null || raw === undefined || raw === '') {
    return fallback
  }
  if (typeof raw === 'boolean') {
    return raw
  }
  if (typeof raw === 'number') {
    return raw !== 0
  }
  const text = String(raw).toLowerCase()
  if (text === 'true' || text === '1') {
    return true
  }
  if (text === 'false' || text === '0') {
    return false
  }
  return fallback
}

/** 规范个人资料对象 */
export function normalizeUserProfile(raw: Record<string, unknown>): UserProfile {
  return {
    userId: pickFirstNonEmptyString(raw.userId, raw.user_id, raw.id),
    username: String(raw.username ?? ''),
    realName: pickFirstNonEmptyString(raw.realName, raw.real_name, raw.displayName, raw.display_name),
    phone: String(raw.phone ?? raw.mobile ?? ''),
    departmentId: pickFirstNonEmptyString(raw.departmentId, raw.department_id, raw.deptId, raw.dept_id),
    departmentName: pickFirstNonEmptyString(
      raw.departmentName,
      raw.department_name,
      raw.department,
      raw.deptName,
    ),
    roleId: pickFirstNonEmptyString(raw.roleId, raw.role_id),
    roleName: pickFirstNonEmptyString(raw.roleName, raw.role_name, raw.role),
  }
}

/** 规范消息偏好 */
export function normalizeMessageNotifyPreferences(raw: unknown): MessageNotifyPreferences {
  const defaults = createDefaultNotifyPreferences()
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>

  return {
    taskComplete: normalizeBoolean(
      obj.taskComplete ?? obj.task_complete,
      defaults.taskComplete,
    ),
    approvalReminder: normalizeBoolean(
      obj.approvalReminder ?? obj.approval_reminder,
      defaults.approvalReminder,
    ),
    alertSummary: normalizeBoolean(
      obj.alertSummary ?? obj.alert_summary,
      defaults.alertSummary,
    ),
    reportNotice: normalizeBoolean(
      obj.reportNotice ?? obj.report_notice,
      defaults.reportNotice,
    ),
    systemAnnouncement: normalizeBoolean(
      obj.systemAnnouncement ?? obj.system_announcement,
      defaults.systemAnnouncement,
    ),
  }
}

/**
 * 规范个人设置详情（基本资料 + 消息偏好）
 * 兼容 data 内嵌 profile / 字段平铺在根对象
 */
export function normalizeUserProfileDetail(raw: unknown): UserProfileDetail {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>

  const profileRaw =
    obj.profile && typeof obj.profile === 'object'
      ? (obj.profile as Record<string, unknown>)
      : obj

  const notifyRaw =
    obj.notifyPreferences ??
    obj.notify_preferences ??
    obj.notificationPreferences ??
    obj.notification_preferences ??
    obj.preferences

  return {
    profile: normalizeUserProfile(profileRaw),
    notifyPreferences: normalizeMessageNotifyPreferences(notifyRaw),
  }
}

/** 规范部门下拉列表（个人设置用） */
export function normalizeProfileDepartmentOptions(raw: unknown) {
  return normalizeDepartmentOptionList(raw)
}

/**
 * 更新基本信息请求体 → 后端 body
 * @param params - 姓名、手机、部门 ID
 */
export function updateUserProfileParamsToApi(
  params: UpdateUserProfileParams,
): Record<string, unknown> {
  return {
    realName: params.realName.trim(),
    phone: params.phone.trim(),
    departmentId: params.departmentId,
  }
}

/**
 * 修改密码请求体 → 后端 body
 * @param params - 旧密码、新密码、确认密码
 */
export function changeUserPasswordParamsToApi(
  params: ChangeUserPasswordParams,
): Record<string, unknown> {
  return {
    oldPassword: params.oldPassword,
    newPassword: params.newPassword,
    confirmPassword: params.confirmPassword,
  }
}

/**
 * 消息偏好 → 后端 body
 * @param preferences - 五项通知勾选
 */
export function notifyPreferencesToApi(
  preferences: MessageNotifyPreferences,
): Record<string, unknown> {
  return { ...preferences }
}
