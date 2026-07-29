import request from '@/utils/request'
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
  changeUserPasswordParamsToApi,
  normalizeMessageNotifyPreferences,
  normalizeProfileDepartmentOptions,
  normalizeUserProfile,
  normalizeUserProfileDetail,
  notifyPreferencesToApi,
  updateUserProfileParamsToApi,
} from '@/utils/profileAdapter'

/**
 * 获取当前登录用户的个人设置详情
 */
export async function getUserProfile(): Promise<ApiResponse<UserProfileDetail>> {
  const res = await request.get<ApiResponse<unknown>>('/api/system/profile')
  const detailRaw = res.data ?? res
  return { ...res, data: normalizeUserProfileDetail(detailRaw) }
}

/**
 * 获取个人设置部门下拉（全部部门列表）
 */
export async function getProfileDepartmentOptions(): Promise<
  ApiResponse<ProfileDepartmentOption[]>
> {
  const res = await request.get<ApiResponse<unknown>>('/api/system/profile/department-options')
  const listRaw = res.data ?? res
  return { ...res, data: normalizeProfileDepartmentOptions(listRaw) }
}

/**
 * 更新当前用户基本信息
 * @param params - 姓名、手机、部门
 */
export async function updateUserProfile(
  params: UpdateUserProfileParams,
): Promise<ApiResponse<UserProfile>> {
  const res = await request.put<ApiResponse<unknown>>(
    '/api/system/profile',
    updateUserProfileParamsToApi(params),
  )
  const profileRaw =
    res.data && typeof res.data === 'object' ? (res.data as Record<string, unknown>) : {}
  return { ...res, data: normalizeUserProfile(profileRaw) }
}

/**
 * 修改当前用户密码（成功后前端需退出登录）
 * @param params - 旧密码、新密码、确认密码
 */
export async function changeUserPassword(
  params: ChangeUserPasswordParams,
): Promise<ApiResponse<null>> {
  return request.put<ApiResponse<null>>(
    '/api/system/profile/password',
    changeUserPasswordParamsToApi(params),
  )
}

/**
 * 保存当前用户消息偏好
 * @param preferences - 五项通知勾选
 */
export async function updateNotifyPreferences(
  preferences: MessageNotifyPreferences,
): Promise<ApiResponse<MessageNotifyPreferences>> {
  const res = await request.put<ApiResponse<unknown>>(
    '/api/system/profile/notify-preferences',
    notifyPreferencesToApi(preferences),
  )
  const prefsRaw = res.data ?? preferences
  return { ...res, data: normalizeMessageNotifyPreferences(prefsRaw) }
}
