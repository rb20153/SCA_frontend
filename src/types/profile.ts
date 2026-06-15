import type { DepartmentOption } from '@/types/user'

/** 个人设置左侧 Tab */
export type ProfileTab = 'basic' | 'password' | 'notify'

/** 消息偏好（与站内消息类型对应） */
export interface MessageNotifyPreferences {
  taskComplete: boolean
  approvalReminder: boolean
  alertSummary: boolean
  reportNotice: boolean
  systemAnnouncement: boolean
}

/** 个人资料（基本设置展示/提交） */
export interface UserProfile {
  userId: string
  username: string
  realName: string
  phone: string
  departmentId: string
  departmentName: string
  roleId: string
  roleName: string
}

/** 个人设置详情（基本资料 + 消息偏好） */
export interface UserProfileDetail {
  profile: UserProfile
  notifyPreferences: MessageNotifyPreferences
}

export interface UpdateUserProfileParams {
  realName: string
  phone: string
  departmentId: string
}

export interface ChangeUserPasswordParams {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

export type ProfileDepartmentOption = DepartmentOption
