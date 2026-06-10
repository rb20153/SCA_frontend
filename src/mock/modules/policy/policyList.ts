import type { Policy } from '@/types/policy'

interface PolicySeed {
  policyName: string
  scenarioDescription: string
  referencedProjectCount: number
  isDefault: boolean
  updatedAt: string
}

const POLICY_SEEDS: PolicySeed[] = [
  {
    policyName: '航空软件标准策略',
    scenarioDescription: '高安全自主率检测',
    referencedProjectCount: 8,
    isDefault: true,
    updatedAt: '2026-05-10T14:30:00+08:00',
  },
  {
    policyName: '开源组件合规策略',
    scenarioDescription: 'SBOM 与许可证合规审查',
    referencedProjectCount: 5,
    isDefault: false,
    updatedAt: '2026-05-18T09:15:00+08:00',
  },
  {
    policyName: '快速扫描策略',
    scenarioDescription: '增量检测与快速回归',
    referencedProjectCount: 0,
    isDefault: false,
    updatedAt: '2026-05-22T16:40:00+08:00',
  },
  {
    policyName: '军工软件严审策略',
    scenarioDescription: '高保密项目自主率评估',
    referencedProjectCount: 3,
    isDefault: false,
    updatedAt: '2026-05-08T11:20:00+08:00',
  },
  {
    policyName: '漏洞深度分析策略',
    scenarioDescription: '开源风险全量漏洞匹配',
    referencedProjectCount: 0,
    isDefault: false,
    updatedAt: '2026-05-25T10:05:00+08:00',
  },
  {
    policyName: '仿真平台通用策略',
    scenarioDescription: '动力学仿真项目通用检测',
    referencedProjectCount: 12,
    isDefault: false,
    updatedAt: '2026-05-12T08:50:00+08:00',
  },
]

const MOCK_POLICY_TOTAL = 26

function buildMockPolicies(count: number): Policy[] {
  return Array.from({ length: count }, (_, index) => {
    const seed = POLICY_SEEDS[index % POLICY_SEEDS.length]
    const seq = index + 1

    return {
      policyId: `policy-${String(seq).padStart(3, '0')}`,
      policyName: seq > POLICY_SEEDS.length ? `${seed.policyName}-${seq}` : seed.policyName,
      scenarioDescription: seed.scenarioDescription,
      referencedProjectCount: seed.referencedProjectCount,
      isDefault: seed.isDefault && seq === 1,
      updatedAt: new Date(
        new Date(seed.updatedAt).getTime() - index * 43_200_000,
      ).toISOString(),
    }
  })
}

/** 策略列表 mock 数据源（支持筛选、分页、删除） */
export const MOCK_ALL_POLICIES: Policy[] = buildMockPolicies(MOCK_POLICY_TOTAL)
// export const MOCK_ALL_POLICIES: Policy[] = []