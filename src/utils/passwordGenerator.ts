/**
 * 生成含大小写字母与数字的随机初始密码
 * @param length - 密码长度，默认 8 位
 */
export function generateInitialPassword(length = 8): string {
  const lower = 'abcdefghijklmnopqrstuvwxyz'
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const digits = '0123456789'
  const all = lower + upper + digits

  const chars: string[] = [
    lower[Math.floor(Math.random() * lower.length)],
    upper[Math.floor(Math.random() * upper.length)],
    digits[Math.floor(Math.random() * digits.length)],
  ]

  for (let i = chars.length; i < length; i += 1) {
    chars.push(all[Math.floor(Math.random() * all.length)])
  }

  return chars.sort(() => Math.random() - 0.5).join('')
}
