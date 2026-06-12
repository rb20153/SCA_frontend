/** 用户名：4-20 位字母或数字（与登录注册一致） */
export const USERNAME_PATTERN = /^[A-Za-z0-9]{4,20}$/

/** 国内手机号：1 开头，第二位 3-9，共 11 位 */
export const PHONE_PATTERN = /^1[3-9]\d{9}$/

/**
 * 校验用户名格式
 * @param username - 登录名
 */
export function isValidUsername(username: string): boolean {
  return USERNAME_PATTERN.test(username.trim())
}

/**
 * 校验手机号是否符合国内号段规则
 * @param phone - 11 位手机号
 */
export function isValidPhone(phone: string): boolean {
  return PHONE_PATTERN.test(phone.trim())
}
