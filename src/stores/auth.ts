import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { getCurrentUser } from '@/api/auth'
import { mergeUserInfoWithCache, normalizeMeUser, type MeUserRaw } from '@/utils/authUser'
import {
  clearStoredToken,
  getRememberMePreference,
  getStoredToken,
  getStoredUserInfo,
  setStoredToken,
  setStoredUserInfo,
} from '@/utils/tokenStorage'
import type { PagePermissionMap } from '@/utils/pagePermission'

export type PermissionStatus = 'idle' | 'loading' | 'ready' | 'failed'

export interface UserInfo {
  userId: string
  username: string
  realName: string
  role: 'admin' | 'analyst' | 'auditor' | 'viewer'
  phone: string
  department: string
  /** /auth/me 返回的页面读写权限；旧字符串数组已在适配层转换为双 true。 */
  permission?: PagePermissionMap
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>(getStoredToken())
  const userInfo = ref<UserInfo | null>(null)
  const permissionStatus = ref<PermissionStatus>(token.value ? 'idle' : 'ready')

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => userInfo.value?.role === 'admin')

  /**
   * 写入 token 并按记住我选择 localStorage 或 sessionStorage
   * @param remember - 默认 true；false 时关闭浏览器后需重新登录
   */
  function setToken(t: string, remember = true) {
    token.value = t
    permissionStatus.value = t ? 'idle' : 'ready'
    setStoredToken(t, remember)
  }

  /**
   * 写入用户信息到 Pinia，并同步缓存（与 token 同 remember 策略）
   * login.userInfo 可能含 displayName 等扩展字段，入库前规范化
   */
  function setUserInfo(info: UserInfo | MeUserRaw) {
    const normalized = normalizeMeUser(info)
    userInfo.value = {
      ...normalized,
      permission: normalized.permission ?? userInfo.value?.permission,
    }
    setStoredUserInfo(userInfo.value, getRememberMePreference())
  }

  /**
   * 凭 token 拉取 /me 恢复用户信息；若 /me 的 realName 退化为 username，用登录缓存兜底
   */
  async function fetchUserInfo() {
    permissionStatus.value = 'loading'
    try {
      const res = await getCurrentUser()
      const cached = getStoredUserInfo<UserInfo>()
      userInfo.value = mergeUserInfoWithCache(res.data, cached)
      if (userInfo.value) {
        setStoredUserInfo(userInfo.value, getRememberMePreference())
      }
      permissionStatus.value = 'ready'
    } catch (error) {
      permissionStatus.value = 'failed'
      throw error
    }
  }

  /** 清除登录态：Pinia 状态 + token / userInfo 缓存 */
  function logout() {
    token.value = ''
    userInfo.value = null
    permissionStatus.value = 'ready'
    clearStoredToken()
  }

  return {
    token,
    userInfo,
    permissionStatus,
    isLoggedIn,
    isAdmin,
    setToken,
    setUserInfo,
    fetchUserInfo,
    logout,
  }
})
