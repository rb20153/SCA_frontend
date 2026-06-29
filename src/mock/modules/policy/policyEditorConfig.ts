import type { PolicyEditorConfig } from '@/types/policy'
import { MOCK_ALL_POLICIES } from '@/mock/modules/policy/policyList'
import { getMockPolicyDetectParams } from '@/mock/modules/policy/policyDetectParams'

/** 新建策略时编辑器默认 JSON 配置 */
export const MOCK_NEW_POLICY_EDITOR_CONFIG: PolicyEditorConfig = {
  name: '',
  similarity_threshold: 0.85,
  min_match_len: 50,
  excluded_folders: ['build/', 'node_modules/', 'third_party/'],
  retry: {
    enabled: true,
    count: 3,
  },
  output_format: 'json',
}

/**
 * 将策略配置对象格式化为带缩进的 JSON 文本
 * @param config - 策略配置对象
 */
export function formatPolicyEditorConfigJson(config: PolicyEditorConfig): string {
  return JSON.stringify(config, null, 2)
}

/** 新建策略编辑器默认文本 */
export const MOCK_NEW_POLICY_EDITOR_JSON = formatPolicyEditorConfigJson(
  MOCK_NEW_POLICY_EDITOR_CONFIG,
)

/**
 * mock：按策略 ID 获取当前生效版本配置文本（编辑已有策略）
 * @param policyId - 策略 ID
 */
export function getMockPolicyEditorConfigText(policyId: string): string | null {
  const policy = MOCK_ALL_POLICIES.find((item) => item.policyId === policyId)
  const params = getMockPolicyDetectParams(policyId)
  if (!policy || !params) {
    return null
  }

  const config: PolicyEditorConfig = {
    name: policy.policyName,
    similarity_threshold: Number((params.similarityThreshold / 100).toFixed(2)),
    min_match_len: params.minMatchLength,
    excluded_folders: [...params.excludeDirectories],
    retry: {
      enabled: true,
      count: 3,
    },
    output_format: 'json',
  }

  return formatPolicyEditorConfigJson(config)
}
