/** localStorage / sessionStorage 中 token 的键名（两处互斥，仅保留一处） */
const TOKEN_KEY = 'sca_token'

/** 与 token 同介质缓存的用户信息，刷新后 /me 字段不全时兜底 realName */
const USER_INFO_KEY = 'sca_user_info'

/** 记住我偏好键名，仅存于 localStorage，用于登录页回显勾选状态 */
const REMEMBER_ME_KEY = 'sca_remember_me'

/**
 * 读取当前有效 token：优先 localStorage（记住我），其次 sessionStorage（会话）
 */
export function getStoredToken(): string {
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY) ?? ''
}

/**
 * 读取登录页「记住我」勾选偏好，默认 true（与历史行为一致）
 */
export function getRememberMePreference(): boolean {
  const stored = localStorage.getItem(REMEMBER_ME_KEY)
  if (stored === null) return true
  return stored === '1'
}

/**
 * 写入 token 并按记住我策略选择存储介质
 * @param token - 登录接口返回的 JWT
 * @param remember - true 用 localStorage；false 用 sessionStorage（关浏览器即失效）
 */
export function setStoredToken(token: string, remember: boolean): void {
  localStorage.setItem(REMEMBER_ME_KEY, remember ? '1' : '0')
  if (remember) {
    localStorage.setItem(TOKEN_KEY, token)
    sessionStorage.removeItem(TOKEN_KEY)
  } else {
    sessionStorage.setItem(TOKEN_KEY, token)
    localStorage.removeItem(TOKEN_KEY)
  }
}

/** 清除两处 token 与用户信息（登出 / 401 时调用）；记住我勾选偏好保留供下次登录回显 */
export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_INFO_KEY)
  sessionStorage.removeItem(USER_INFO_KEY)
}

/**
 * 与 token 相同 remember 策略缓存 userInfo（login 成功后写入，/me 兜底用）
 */
export function setStoredUserInfo(info: object, remember: boolean): void {
  const json = JSON.stringify(info)
  if (remember) {
    localStorage.setItem(USER_INFO_KEY, json)
    sessionStorage.removeItem(USER_INFO_KEY)
  } else {
    sessionStorage.setItem(USER_INFO_KEY, json)
    localStorage.removeItem(USER_INFO_KEY)
  }
}

/** 读取缓存的用户信息，无则 null */
export function getStoredUserInfo<T>(): T | null {
  const raw = localStorage.getItem(USER_INFO_KEY) ?? sessionStorage.getItem(USER_INFO_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}
