import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { getCurrentUser } from '@/api/auth'

export interface UserInfo {
  userId: string
  username: string
  realName: string
  role: 'admin' | 'analyst' | 'auditor' | 'viewer'
  phone: string
  department: string
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>(localStorage.getItem('sca_token') ?? '')
  const userInfo = ref<UserInfo | null>(null)

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => userInfo.value?.role === 'admin')

  /** 写入 token 并同步到 localStorage，刷新后仍保持登录态 */
  function setToken(t: string) {
    token.value = t
    localStorage.setItem('sca_token', t)
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

  /** 清除登录态：Pinia 状态 + localStorage token */
  function logout() {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('sca_token')
  }

  return { token, userInfo, isLoggedIn, isAdmin, setToken, setUserInfo, fetchUserInfo, logout }
})
