import type {
  ChangeUserPasswordParams,
  MessageNotifyPreferences,
  ProfileDepartmentOption,
  UpdateUserProfileParams,
  UserProfile,
  UserProfileDetail,
} from '@/types/profile'
import { mockCurrentUserRes, mockLoginRes } from '@/mock/modules/auth/users'
import { MOCK_ALL_DEPARTMENTS } from '@/mock/modules/system/departmentList'
import { MOCK_ALL_USERS, MOCK_USER_PASSWORDS } from '@/mock/modules/system/userList'

const DEFAULT_NOTIFY_PREFERENCES: MessageNotifyPreferences = {
  taskComplete: true,
  approvalReminder: true,
  alertSummary: true,
  reportNotice: true,
  systemAnnouncement: false,
}

/** 按用户 ID 存储的消息偏好（mock 运行时） */
const MOCK_NOTIFY_PREFERENCES: Record<string, MessageNotifyPreferences> = {}

/** mock 阶段当前登录用户固定为 admin */
const MOCK_CURRENT_USERNAME = 'admin'

/**
 * 获取全部部门下拉（个人设置用，含启用与禁用）
 */
export function getMockProfileDepartmentOptions(): ProfileDepartmentOption[] {
  return MOCK_ALL_DEPARTMENTS.map((item) => ({
    departmentId: item.departmentId,
    departmentName: item.departmentName,
  })).sort((a, b) => a.departmentName.localeCompare(b.departmentName, 'zh-CN'))
}

/** 根据用户名查找 mock 用户记录 */
function findMockUserByUsername(username: string) {
  return MOCK_ALL_USERS.find((item) => item.username === username)
}

/** 将用户记录转为个人资料结构 */
function toUserProfile(user: (typeof MOCK_ALL_USERS)[number]): UserProfile {
  return {
    userId: user.userId,
    username: user.username,
    realName: user.realName,
    phone: user.phone,
    departmentId: user.departmentId,
    departmentName: user.departmentName,
    roleId: user.roleId,
    roleName: user.roleName,
  }
}

/** 同步 admin 登录态 userInfo（姓名/手机/部门名） */
function syncAuthMockUserInfo(profile: UserProfile) {
  const roleMap: Record<string, 'admin' | 'analyst' | 'auditor' | 'viewer'> = {
    管理员: 'admin',
    检测工程师: 'analyst',
    审计员: 'auditor',
    只读: 'viewer',
  }
  const role = roleMap[profile.roleName] ?? 'admin'
  const authInfo = {
    userId: profile.userId,
    username: profile.username,
    realName: profile.realName,
    role,
    phone: profile.phone,
    department: profile.departmentName,
  }
  mockLoginRes.data.userInfo = authInfo
  mockCurrentUserRes.data = authInfo
}

/**
 * 获取当前用户个人设置详情
 */
export function getMockUserProfileDetail(): UserProfileDetail {
  const user = findMockUserByUsername(MOCK_CURRENT_USERNAME)
  if (!user) {
    throw new Error('用户不存在')
  }
  const profile = toUserProfile(user)
  const notifyPreferences =
    MOCK_NOTIFY_PREFERENCES[user.userId] ?? { ...DEFAULT_NOTIFY_PREFERENCES }
  return { profile, notifyPreferences }
}

/**
 * 更新当前用户基本信息
 * @param params - 姓名、手机、部门 ID
 */
export function updateMockUserProfile(params: UpdateUserProfileParams): UserProfile {
  const user = findMockUserByUsername(MOCK_CURRENT_USERNAME)
  if (!user) {
    throw new Error('用户不存在')
  }

  const department = MOCK_ALL_DEPARTMENTS.find((item) => item.departmentId === params.departmentId)
  if (!department) {
    throw new Error('部门不存在')
  }

  user.realName = params.realName.trim()
  user.phone = params.phone.trim()
  user.departmentId = department.departmentId
  user.departmentName = department.departmentName

  const profile = toUserProfile(user)
  syncAuthMockUserInfo(profile)
  return profile
}

/**
 * 修改当前用户密码（mock 校验旧密码）
 * @param params - 旧密码、新密码、确认密码
 */
export function changeMockUserPassword(params: ChangeUserPasswordParams): void {
  const user = findMockUserByUsername(MOCK_CURRENT_USERNAME)
  if (!user) {
    throw new Error('用户不存在')
  }

  const currentPassword = MOCK_USER_PASSWORDS[user.userId]
  if (!currentPassword || currentPassword !== params.oldPassword) {
    throw new Error('旧密码不正确')
  }
  if (params.newPassword !== params.confirmPassword) {
    throw new Error('两次输入的新密码不一致')
  }

  MOCK_USER_PASSWORDS[user.userId] = params.newPassword
}

/**
 * 更新当前用户消息偏好
 * @param preferences - 五项勾选状态
 */
export function updateMockNotifyPreferences(
  preferences: MessageNotifyPreferences,
): MessageNotifyPreferences {
  const user = findMockUserByUsername(MOCK_CURRENT_USERNAME)
  if (!user) {
    throw new Error('用户不存在')
  }
  MOCK_NOTIFY_PREFERENCES[user.userId] = { ...preferences }
  return MOCK_NOTIFY_PREFERENCES[user.userId]
}
