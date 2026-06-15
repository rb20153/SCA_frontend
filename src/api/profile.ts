import type { ApiResponse } from '@/types/common'
import type {
  ChangeUserPasswordParams,
  MessageNotifyPreferences,
  ProfileDepartmentOption,
  UpdateUserProfileParams,
  UserProfile,
  UserProfileDetail,
} from '@/types/profile'
import {
  changeMockUserPassword,
  getMockProfileDepartmentOptions,
  getMockUserProfileDetail,
  updateMockNotifyPreferences,
  updateMockUserProfile,
} from '@/mock/modules/system/userProfile'

/**
 * 获取当前登录用户的个人设置详情
 */
export function getUserProfile(): Promise<ApiResponse<UserProfileDetail>> {
  // TODO: replace with → return request.get('/api/system/profile')
  return Promise.resolve({
    code: 200,
    message: 'ok',
    data: getMockUserProfileDetail(),
  })
}

/**
 * 获取个人设置部门下拉（全部部门列表）
 */
export function getProfileDepartmentOptions(): Promise<ApiResponse<ProfileDepartmentOption[]>> {
  // TODO: replace with → return request.get('/api/system/profile/department-options')
  return Promise.resolve({
    code: 200,
    message: 'ok',
    data: getMockProfileDepartmentOptions(),
  })
}

/**
 * 更新当前用户基本信息
 * @param params - 姓名、手机、部门
 */
export function updateUserProfile(
  params: UpdateUserProfileParams,
): Promise<ApiResponse<UserProfile>> {
  // TODO: replace with → return request.put('/api/system/profile', params)
  try {
    const profile = updateMockUserProfile(params)
    return Promise.resolve({ code: 200, message: '基本信息已更新', data: profile })
  } catch (error) {
    const msg = error instanceof Error ? error.message : '更新失败'
    return Promise.reject(new Error(msg))
  }
}

/**
 * 修改当前用户密码（成功后前端需退出登录）
 * @param params - 旧密码、新密码、确认密码
 */
export function changeUserPassword(params: ChangeUserPasswordParams): Promise<ApiResponse<null>> {
  // TODO: replace with → return request.put('/api/system/profile/password', params)
  try {
    changeMockUserPassword(params)
    return Promise.resolve({ code: 200, message: '密码已修改，请重新登录', data: null })
  } catch (error) {
    const msg = error instanceof Error ? error.message : '修改密码失败'
    return Promise.reject(new Error(msg))
  }
}

/**
 * 保存当前用户消息偏好
 * @param preferences - 五项通知勾选
 */
export function updateNotifyPreferences(
  preferences: MessageNotifyPreferences,
): Promise<ApiResponse<MessageNotifyPreferences>> {
  // TODO: replace with → return request.put('/api/system/profile/notify-preferences', preferences)
  const data = updateMockNotifyPreferences(preferences)
  return Promise.resolve({ code: 200, message: '消息偏好已保存', data })
}
