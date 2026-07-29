/** 系统临时密码默认长度（与 admin 初始密码复杂度接近） */
export const INITIAL_PASSWORD_DEFAULT_LENGTH = 32

/** 系统临时密码最小长度（与后端重置/创建用户规则一致） */
export const INITIAL_PASSWORD_MIN_LENGTH = 12

/** 临时密码特殊字符（与现有 admin 密码风格一致：! - _） */
const SPECIAL_CHARS = '!-_'

const LOWER_CHARS = 'abcdefghijklmnopqrstuvwxyz'
const UPPER_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const DIGIT_CHARS = '0123456789'
const ALL_CHARS = LOWER_CHARS + UPPER_CHARS + DIGIT_CHARS + SPECIAL_CHARS

/**
 * 密码强度是否满足后端规则：至少 12 位，含大小写字母、数字、特殊字符
 * @param password - 明文密码
 */
export function isStrongSystemPassword(password: string): boolean {
  if (password.length < INITIAL_PASSWORD_MIN_LENGTH) {
    return false
  }
  if (!/[a-z]/.test(password)) {
    return false
  }
  if (!/[A-Z]/.test(password)) {
    return false
  }
  if (!/\d/.test(password)) {
    return false
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return false
  }
  return true
}

/** 使用 crypto 生成 [0, max) 的均匀随机整数 */
function secureRandomInt(max: number): number {
  if (max <= 0) {
    return 0
  }
  const buffer = new Uint32Array(1)
  crypto.getRandomValues(buffer)
  return buffer[0] % max
}

/** 从字符池中随机取一个字符 */
function pickChar(pool: string): string {
  return pool[secureRandomInt(pool.length)]
}

/** Fisher-Yates 洗牌，避免 sort(random) 分布不均 */
function shuffleInPlace<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = secureRandomInt(i + 1)
    const tmp = items[i]
    items[i] = items[j]
    items[j] = tmp
  }
  return items
}

/**
 * 生成符合后端规则的随机临时密码：默认 32 位，含大小写字母、数字、特殊字符（!-_）
 * @param length - 密码长度，默认 32；小于 12 时自动提升到 12
 */
export function generateInitialPassword(length = INITIAL_PASSWORD_DEFAULT_LENGTH): string {
  const targetLength = Math.max(length, INITIAL_PASSWORD_MIN_LENGTH)

  for (let attempt = 0; attempt < 32; attempt += 1) {
    const chars: string[] = [
      pickChar(UPPER_CHARS),
      pickChar(LOWER_CHARS),
      pickChar(LOWER_CHARS),
      pickChar(LOWER_CHARS),
      pickChar(SPECIAL_CHARS),
      pickChar(LOWER_CHARS),
      pickChar(DIGIT_CHARS),
      pickChar(SPECIAL_CHARS),
    ]

    while (chars.length < targetLength) {
      chars.push(pickChar(ALL_CHARS))
    }

    const password = shuffleInPlace(chars).join('')
    if (isStrongSystemPassword(password)) {
      return password
    }
  }

  // 极端情况下兜底：仍保证规则与长度
  const fallback = [
    'Aero',
    '!',
    pickChar(LOWER_CHARS),
    pickChar(DIGIT_CHARS),
    '-',
    pickChar(UPPER_CHARS),
    pickChar(LOWER_CHARS),
    pickChar(DIGIT_CHARS),
  ]
  while (fallback.length < targetLength) {
    fallback.push(pickChar(ALL_CHARS))
  }
  return shuffleInPlace(fallback).join('')
}
