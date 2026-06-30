import type { PageParams } from '@/types/common'
import type {
  PolicyGovernanceOverview,
  PolicyVersionListItem,
  PolicyVersionStatus,
  SubmitPolicyPublishParams,
  SubmitPolicyPublishResult,
  SubmitPolicyVersionApprovalParams,
  SubmitPolicyVersionApprovalResult,
  ExportPolicyVersionParams,
  PolicyVersionExportResult,
  PolicyVersionExportScope,
  RollbackPolicyVersionParams,
} from '@/types/policy'
import { MOCK_ALL_POLICIES } from '@/mock/modules/policy/policyList'
import { parsePolicyEditorConfig } from '@/utils/policyConfigParse'
import { isPolicyVersionGreaterThan } from '@/utils/policyVersionDisplay'

interface PolicyVersionSeed {
  versionNo: string
  status: PolicyVersionStatus
  creatorId: string
  creatorName: string
  createdAt: string
  changeSummary: string
}

const DEFAULT_VERSION_SEEDS: PolicyVersionSeed[] = [
  {
    versionNo: 'v2.4.0',
    status: 'pending',
    creatorId: 'u001',
    creatorName: '管理员',
    createdAt: '2026-05-28T16:20:00+08:00',
    changeSummary: '提高相似度阈值；新增 third_party 排除目录',
  },
  {
    versionNo: 'v2.3.1',
    status: 'published',
    creatorId: 'u001',
    creatorName: '管理员',
    createdAt: '2026-05-10T14:30:00+08:00',
    changeSummary: '当前生效版本，对齐航空软件检测基线',
  },
  {
    versionNo: 'v2.2.0',
    status: 'history',
    creatorId: 'u002',
    creatorName: '张工',
    createdAt: '2026-04-02T09:15:00+08:00',
    changeSummary: '调整最小匹配长度与重试次数',
  },
  {
    versionNo: 'v2.1.0',
    status: 'history',
    creatorId: 'u001',
    creatorName: '管理员',
    createdAt: '2026-03-12T11:40:00+08:00',
    changeSummary: '初始发布版本',
  },
]

/** 按策略 ID 存储的版本列表（mock 可变） */
const mockPolicyVersions = new Map<string, PolicyVersionListItem[]>()

/** 初始化每个策略的版本 mock 数据 */
function ensurePolicyVersions(policyId: string): PolicyVersionListItem[] {
  const cached = mockPolicyVersions.get(policyId)
  if (cached) {
    return cached
  }

  const policyIndex = MOCK_ALL_POLICIES.findIndex((item) => item.policyId === policyId)
  const list = DEFAULT_VERSION_SEEDS.map((seed, index) => ({
    versionId: `${policyId}-ver-${index + 1}`,
    policyId,
    versionNo: policyIndex > 0 ? `${seed.versionNo}-p${policyIndex + 1}` : seed.versionNo,
    status: seed.status,
    creatorId: seed.creatorId,
    creatorName: seed.creatorName,
    createdAt: seed.createdAt,
    changeSummary: seed.changeSummary,
  }))

  mockPolicyVersions.set(policyId, list)
  return list
}

/** 从版本列表推导概览统计 */
function buildGovernanceOverview(policyId: string): PolicyGovernanceOverview | null {
  const policy = MOCK_ALL_POLICIES.find((item) => item.policyId === policyId)
  if (!policy) {
    return null
  }

  const versions = ensurePolicyVersions(policyId)
  const published = versions.find((item) => item.status === 'published')
  const pendingCount = versions.filter((item) => item.status === 'pending').length
  const lastChangedAt =
    [...versions].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0]?.createdAt ?? policy.updatedAt

  return {
    policyId,
    policyName: policy.policyName,
    currentVersion: published?.versionNo ?? '—',
    pendingCount,
    lastChangedAt,
  }
}

/**
 * mock：获取策略版本与审批页概览
 * @param policyId - 策略 ID
 */
export function getMockPolicyGovernanceOverview(
  policyId: string,
): PolicyGovernanceOverview | null {
  return buildGovernanceOverview(policyId)
}

/**
 * mock：获取策略当前生效版本号（编辑器校验用）
 * @param policyId - 策略 ID
 */
export function getMockPolicyCurrentVersion(policyId: string): string | null {
  const overview = buildGovernanceOverview(policyId)
  if (!overview || overview.currentVersion === '—') {
    return null
  }
  return overview.currentVersion
}

/**
 * mock：分页获取策略版本列表（按创建时间倒序）
 * @param policyId - 策略 ID
 * @param params - 分页参数
 */
export function getMockPolicyVersionPage(
  policyId: string,
  params: PageParams,
): { list: PolicyVersionListItem[]; total: number; page: number; pageSize: number } {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 10
  const sorted = [...ensurePolicyVersions(policyId)].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
  const start = (page - 1) * pageSize

  return {
    list: sorted.slice(start, start + pageSize).map((item) => ({ ...item })),
    total: sorted.length,
    page,
    pageSize,
  }
}

/**
 * mock：提交策略发布申请（新增待审批版本）
 * @param params - 发布申请参数
 */
export function submitMockPolicyPublishApplication(
  params: SubmitPolicyPublishParams,
): SubmitPolicyPublishResult {
  const parsed = parsePolicyEditorConfig(params.configText)
  if (!parsed.ok) {
    throw new Error('策略配置格式不合法')
  }

  const policyName = parsed.config.name.trim()
  if (!policyName) {
    throw new Error('策略名称不能为空')
  }

  const versionNo = params.versionNo.trim()
  const changeSummary = params.changeSummary.trim()
  if (!versionNo || !changeSummary) {
    throw new Error('版本号与变更摘要不能为空')
  }

  let policyId = params.policyId

  if (policyId === 'new') {
    const nextSeq = MOCK_ALL_POLICIES.length + 1
    policyId = `policy-${String(nextSeq).padStart(3, '0')}`
    MOCK_ALL_POLICIES.unshift({
      policyId,
      policyName,
      scenarioDescription: '新建策略待发布',
      referencedProjectCount: 0,
      isDefault: false,
      updatedAt: new Date().toISOString(),
    })
    mockPolicyVersions.set(policyId, [])
  } else {
    const policy = MOCK_ALL_POLICIES.find((item) => item.policyId === policyId)
    if (!policy) {
      throw new Error('策略不存在')
    }

    const currentVersion = getMockPolicyCurrentVersion(policyId)
    if (currentVersion && !isPolicyVersionGreaterThan(versionNo, currentVersion)) {
      throw new Error(`版本号必须大于当前生效版本 ${currentVersion}`)
    }

    policy.policyName = policyName
    policy.updatedAt = new Date().toISOString()
  }

  const versions = ensurePolicyVersions(policyId)
  const now = new Date().toISOString()
  const versionId = `${policyId}-ver-${versions.length + 1}`
  const creatorName = params.editorId === 'u001' ? '管理员' : '当前用户'

  versions.unshift({
    versionId,
    policyId,
    versionNo,
    status: 'pending',
    creatorId: params.editorId,
    creatorName,
    createdAt: now,
    changeSummary,
  })

  return {
    policyId,
    versionId,
    versionNo,
  }
}

/**
 * mock：获取策略的全部版本（不分页，供差异对比解析）
 * @param policyId - 策略 ID
 */
export function getMockPolicyVersionsAll(policyId: string): PolicyVersionListItem[] {
  return [...ensurePolicyVersions(policyId)]
}

/**
 * mock：提交策略版本发布审批
 * @param params - 审批结论、意见与生效时间
 */
export function submitMockPolicyVersionApproval(
  params: SubmitPolicyVersionApprovalParams,
): SubmitPolicyVersionApprovalResult {
  void params.opinion
  const versions = ensurePolicyVersions(params.policyId)
  const pendingIndex = versions.findIndex(
    (item) => item.versionId === params.versionId && item.status === 'pending',
  )

  if (pendingIndex < 0) {
    throw new Error('待审批版本不存在或已处理')
  }

  const pending = versions[pendingIndex]

  if (params.conclusion === 'rejected') {
    versions.splice(pendingIndex, 1)
    return {
      versionId: params.versionId,
      conclusion: params.conclusion,
      effectiveTime: params.effectiveTime,
    }
  }

  if (params.effectiveTime === 'next-window') {
    return {
      versionId: params.versionId,
      conclusion: params.conclusion,
      effectiveTime: params.effectiveTime,
    }
  }

  const published = versions.find((item) => item.status === 'published')
  if (published) {
    published.status = 'history'
  }

  pending.status = 'published'

  return {
    versionId: params.versionId,
    conclusion: params.conclusion,
    effectiveTime: params.effectiveTime,
  }
}

const POLICY_EXPORT_SCOPE_LABEL: Record<PolicyVersionExportScope, string> = {
  'params-and-rules': '策略参数 + 规则集',
  'params-only': '仅策略参数',
  'rules-only': '仅规则集',
}

/**
 * mock：导出指定策略版本文件
 * @param params - 导出范围与格式
 */
export function exportMockPolicyVersion(
  params: ExportPolicyVersionParams,
): PolicyVersionExportResult {
  const versions = ensurePolicyVersions(params.policyId)
  const version = versions.find((item) => item.versionId === params.versionId)
  const policy = MOCK_ALL_POLICIES.find((item) => item.policyId === params.policyId)

  if (!version || !policy) {
    throw new Error('策略版本不存在')
  }

  const scopeLabel = POLICY_EXPORT_SCOPE_LABEL[params.scope]
  const payload =
    params.format === 'yaml'
      ? [
          `name: "${policy.policyName}"`,
          `version: "${version.versionNo}"`,
          `export_scope: "${scopeLabel}"`,
          'similarity_threshold: 0.85',
          'min_match_len: 50',
          'rules:',
          '  - keyword: token',
          '    action: replace',
        ].join('\n')
      : JSON.stringify(
          {
            name: policy.policyName,
            version: version.versionNo,
            exportScope: scopeLabel,
            similarity_threshold: 0.85,
            min_match_len: 50,
            rules:
              params.scope === 'params-only'
                ? undefined
                : [{ keyword: 'token', action: 'replace' }],
          },
          null,
          2,
        )

  const extension = params.format === 'yaml' ? 'yaml' : 'json'
  const mime =
    params.format === 'yaml' ? 'application/x-yaml' : 'application/json;charset=utf-8'
  const blob = new Blob([payload], { type: mime })
  const safeName = policy.policyName.replace(/[^\w\u4e00-\u9fa5-]+/g, '_')

  return {
    downloadUrl: URL.createObjectURL(blob),
    fileName: `${safeName}_${version.versionNo}.${extension}`,
  }
}

/**
 * mock：回滚历史版本为当前生效版本
 * @param params - 目标版本 ID 与确认版本号
 */
export function rollbackMockPolicyVersion(params: RollbackPolicyVersionParams): void {
  const versions = ensurePolicyVersions(params.policyId)
  const target = versions.find(
    (item) => item.versionId === params.versionId && item.status === 'history',
  )

  if (!target) {
    throw new Error('历史版本不存在或不可回滚')
  }

  if (target.versionNo.trim() !== params.confirmVersionNo.trim()) {
    throw new Error('版本号确认不正确')
  }

  const published = versions.find((item) => item.status === 'published')
  if (published) {
    published.status = 'history'
  }

  target.status = 'published'
}
