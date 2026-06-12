import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { getCurrentUser } from '@/api/auth'
import { clearStoredToken, getStoredToken, setStoredToken } from '@/utils/tokenStorage'

export interface UserInfo {
  userId: string
  username: string
  realName: string
  role: 'admin' | 'analyst' | 'auditor' | 'viewer'
  phone: string
  department: string
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>(getStoredToken())
  const userInfo = ref<UserInfo | null>(null)

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => userInfo.value?.role === 'admin')

  /**
   * 写入 token 并按记住我选择 localStorage 或 sessionStorage
   * @param remember - 默认 true；false 时关闭浏览器后需重新登录
   */
  function setToken(t: string, remember = true) {
    token.value = t
    setStoredToken(t, remember)
  }

  /** 写入用户信息到 Pinia（仅内存，刷新后需通过 fetchUserInfo 恢复） */
  function setUserInfo(info: UserInfo) {
    userInfo.value = info
  }

  /**
   * 凭 token 拉取当前用户信息（用于页面刷新后恢复顶栏姓名等）
   * 联调时 getCurrentUser 会走真实 /api/auth/me，此处无需改动
   */
  async function fetchUserInfo() {
    const res = await getCurrentUser()
    userInfo.value = res.data
  }

  /** 清除登录态：Pinia 状态 + 两处 storage 中的 token */
  function logout() {
    token.value = ''
    userInfo.value = null
    clearStoredToken()
  }

  return { token, userInfo, isLoggedIn, isAdmin, setToken, setUserInfo, fetchUserInfo, logout }
})
