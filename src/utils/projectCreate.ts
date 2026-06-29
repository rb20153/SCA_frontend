import type { ProjectPolicyBindingInput } from '@/types/project'

/** 创建项目 · 默认排除目录 */
export const DEFAULT_PROJECT_EXCLUDE_DIRECTORIES = [
  'node_modules/',
  'build/',
  'third_party/',
] as const

/** 创建项目 · 默认相似度阈值 */
export const DEFAULT_PROJECT_SIMILARITY_THRESHOLD = 85

/** 创建项目 · 默认最小匹配长度 */
export const DEFAULT_PROJECT_MIN_MATCH_LENGTH = 50

/**
 * 返回创建项目向导中策略绑定的默认表单值（参数字段待选择策略后自动填充）
 */
export function createDefaultProjectPolicyBinding(): Omit<
  ProjectPolicyBindingInput,
  'policyId'
> & {
  policyId: string | undefined
} {
  return {
    policyId: undefined,
    similarityThreshold: 0,
    minMatchLength: 0,
    excludeDirectories: [],
  }
}

/**
 * 校验策略绑定步骤表单
 * @param policy - 策略绑定字段
 */
export function validateProjectPolicyBinding(
  policy: Omit<ProjectPolicyBindingInput, 'policyId'> & { policyId?: string },
): { valid: boolean; message?: string } {
  if (!policy.policyId) {
    return { valid: false, message: '请选择检测策略' }
  }
  if (
    policy.similarityThreshold < 0 ||
    policy.similarityThreshold > 100 ||
    !Number.isFinite(policy.similarityThreshold)
  ) {
    return { valid: false, message: '相似度阈值需在 0–100 之间' }
  }
  if (policy.minMatchLength < 1 || !Number.isFinite(policy.minMatchLength)) {
    return { valid: false, message: '最小匹配长度至少为 1' }
  }
  return { valid: true }
}
