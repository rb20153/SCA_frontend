/** 角色编码：仅允许英文字母与下划线 */
export const ROLE_CODE_PATTERN = /^[A-Za-z_]+$/

/**
 * 校验角色编码格式（纯英文或下划线）
 * @param roleCode - 用户输入的编码
 */
export function isValidRoleCode(roleCode: string): boolean {
  return ROLE_CODE_PATTERN.test(roleCode.trim())
}
