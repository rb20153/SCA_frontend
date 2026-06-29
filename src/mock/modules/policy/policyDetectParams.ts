import type { PolicyDetectParams } from '@/types/policy'
import { MOCK_ALL_POLICIES } from '@/mock/modules/policy/policyList'

/** 各策略种子对应的检测参数（与策略编辑器 JSON 口径一致，阈值为 0–100） */
const POLICY_DETECT_PARAM_SEEDS: PolicyDetectParams[] = [
  {
    similarityThreshold: 85,
    minMatchLength: 50,
    excludeDirectories: ['a/', 'b/'],
  },
  {
    similarityThreshold: 80,
    minMatchLength: 40,
    excludeDirectories: ['vendor/', 'dist/'],
  },
  {
    similarityThreshold: 75,
    minMatchLength: 30,
    excludeDirectories: ['node_modules/', 'build/', 'third_party/'],
  },
  {
    similarityThreshold: 90,
    minMatchLength: 60,
    excludeDirectories: ['external/', 'third_party/', 'deps/'],
  },
  {
    similarityThreshold: 82,
    minMatchLength: 45,
    excludeDirectories: ['test/', 'docs/', 'build/'],
  },
  {
    similarityThreshold: 78,
    minMatchLength: 35,
    excludeDirectories: ['cmake-build/', 'out/', 'bin/'],
  },
]

/**
 * mock：按策略 ID 获取当前生效版本的检测参数默认值
 * @param policyId - 策略 ID
 */
export function getMockPolicyDetectParams(policyId: string): PolicyDetectParams | null {
  const index = MOCK_ALL_POLICIES.findIndex((item) => item.policyId === policyId)
  if (index < 0) {
    return null
  }
  const seed = POLICY_DETECT_PARAM_SEEDS[index % POLICY_DETECT_PARAM_SEEDS.length]
  return {
    similarityThreshold: seed.similarityThreshold,
    minMatchLength: seed.minMatchLength,
    excludeDirectories: [...seed.excludeDirectories],
  }
}
