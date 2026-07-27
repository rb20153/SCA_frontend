import type { UserInfo } from '@/stores/auth'

/** 后端 /me 或 login.userInfo 可能携带的 JWT / 扩展字段（需剥离） */
export interface MeUserRaw {
  userId?: string
  id?: number | string
  username: string
  realName?: string
  displayName?: string
  role?: string
  phone?: string
  department?: string
}

const USER_ROLES = ['admin', 'analyst', 'auditor', 'viewer'] as const

/** 将后端角色编码规范为前端 UserInfo.role（未知角色降级为 analyst） */
function normalizeUserRole(role: string | undefined): UserInfo['role'] {
  if (role && (USER_ROLES as readonly string[]).includes(role)) {
    return role as UserInfo['role']
  }
  return 'analyst'
}

/**
 * 将 /me 或 login.userInfo 原始对象规范为顶栏使用的 UserInfo
 * - 优先 displayName，与 login 接口 userInfo 口径一致
 * - userId 兼容 id 数字字段
 */
export function normalizeMeUser(raw: MeUserRaw): UserInfo {
  const displayName = raw.displayName?.trim()
  const realNameField = raw.realName?.trim()
  const realName = displayName || realNameField || raw.username

  return {
    userId: String(raw.userId ?? raw.id ?? ''),
    username: raw.username,
    realName,
    role: normalizeUserRole(raw.role),
    phone: raw.phone ?? '',
    department: raw.department ?? '',
  }
}

/**
 * 刷新后 /me 若把 realName 填成 username，用登录时缓存的姓名兜底（与 login.userInfo 一致）
 */
export function mergeUserInfoWithCache(fetched: UserInfo, cached: UserInfo | null): UserInfo {
  if (!cached) return fetched
  const meRealNameLooksLikeUsername =
    fetched.realName === fetched.username && cached.realName !== cached.username
  if (meRealNameLooksLikeUsername) {
    return { ...fetched, realName: cached.realName }
  }
  return fetched
}
