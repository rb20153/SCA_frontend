import type { ProjectPolicyBinding, ProjectPolicyBindingInput } from '@/types/project'
import { MOCK_ALL_PROJECTS } from '@/mock/modules/project/projectList'
import { MOCK_ALL_POLICIES } from '@/mock/modules/policy/policyList'
import {
  DEFAULT_PROJECT_EXCLUDE_DIRECTORIES,
  DEFAULT_PROJECT_MIN_MATCH_LENGTH,
  DEFAULT_PROJECT_SIMILARITY_THRESHOLD,
} from '@/utils/projectCreate'

/** 项目 ID → 已绑定策略 */
export const MOCK_PROJECT_POLICY_BINDINGS: Record<string, ProjectPolicyBinding> = {}

/**
 * mock：为项目写入策略绑定
 * @param projectId - 项目 ID
 * @param input - 绑定参数
 */
export function mockSetProjectPolicyBinding(
  projectId: string,
  input: ProjectPolicyBindingInput,
): ProjectPolicyBinding {
  const policy = MOCK_ALL_POLICIES.find((item) => item.policyId === input.policyId)
  const binding: ProjectPolicyBinding = {
    ...input,
    policyName: policy?.policyName ?? input.policyId,
  }
  MOCK_PROJECT_POLICY_BINDINGS[projectId] = binding
  return binding
}

/**
 * mock：获取项目策略绑定
 * @param projectId - 项目 ID
 */
export function getMockProjectPolicyBinding(
  projectId: string,
): ProjectPolicyBinding | undefined {
  return MOCK_PROJECT_POLICY_BINDINGS[projectId]
}

/**
 * mock：为种子项目初始化策略绑定（无绑定时使用默认策略与阈值）
 */
function seedMockProjectPolicyBindings(): void {
  const defaultPolicy =
    MOCK_ALL_POLICIES.find((item) => item.isDefault) ?? MOCK_ALL_POLICIES[0]
  if (!defaultPolicy) {
    return
  }

  for (const project of MOCK_ALL_PROJECTS) {
    if (MOCK_PROJECT_POLICY_BINDINGS[project.projectId]) {
      continue
    }
    mockSetProjectPolicyBinding(project.projectId, {
      policyId: defaultPolicy.policyId,
      similarityThreshold: DEFAULT_PROJECT_SIMILARITY_THRESHOLD,
      minMatchLength: DEFAULT_PROJECT_MIN_MATCH_LENGTH,
      excludeDirectories: [...DEFAULT_PROJECT_EXCLUDE_DIRECTORIES],
    })
  }
}

seedMockProjectPolicyBindings()
