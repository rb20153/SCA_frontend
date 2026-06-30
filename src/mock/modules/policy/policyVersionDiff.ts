import type {
  PolicyVersionDiffExportResult,
  PolicyVersionDiffResult,
} from '@/types/policy'
import { MOCK_ALL_POLICIES } from '@/mock/modules/policy/policyList'
import { getMockPolicyVersionsAll } from '@/mock/modules/policy/policyVersionList'
import { resolvePolicyVersionDiffPair } from '@/utils/policyVersionDiff'

/**
 * mock：生成某版本的策略配置摘要文本（供差异对比展示）
 * @param policyId - 策略 ID
 * @param version - 版本列表项
 */
function buildMockVersionConfigSummary(
  policyId: string,
  version: { versionNo: string; status: string; changeSummary: string },
): string {
  const policy = MOCK_ALL_POLICIES.find((item) => item.policyId === policyId)
  const match = version.versionNo.match(/(\d+)(?:[.-](\d+))?(?:[.-](\d+))?/)
  const minor = match?.[2] ? Number.parseInt(match[2], 10) : 3
  const patch = match?.[3] ? Number.parseInt(match[3], 10) : 1
  const threshold = (0.8 + minor * 0.02 + patch * 0.001).toFixed(2)
  const minLen = 40 + minor * 5 + patch
  const folders =
    version.status === 'pending'
      ? 'build/, node_modules/, third_party/'
      : 'build/, node_modules/'

  return [
    `name = "${policy?.policyName ?? '策略'}"`,
    `similarity_threshold = ${threshold}`,
    `min_match_len = ${minLen}`,
    `excluded_folders = ${folders}`,
    'retry.enabled = true',
    'retry.count = 3',
    'output_format = json',
    '',
    '# 变更摘要',
    version.changeSummary,
  ].join('\n')
}

/**
 * mock：获取策略版本差异对比数据
 * @param policyId - 策略 ID
 * @param anchorVersionId - 当前点击的行版本 ID
 */
export function getMockPolicyVersionDiff(
  policyId: string,
  anchorVersionId: string,
): PolicyVersionDiffResult | null {
  const policy = MOCK_ALL_POLICIES.find((item) => item.policyId === policyId)
  const allVersions = getMockPolicyVersionsAll(policyId)
  const anchor = allVersions.find((item) => item.versionId === anchorVersionId)
  if (!policy || !anchor) {
    return null
  }

  const pair = resolvePolicyVersionDiffPair(anchor, allVersions)
  if (!pair) {
    return null
  }

  return {
    policyId,
    policyName: policy.policyName,
    anchorVersionId,
    leftVersionId: pair.left.versionId,
    rightVersionId: pair.right.versionId,
    left: {
      versionId: pair.left.versionId,
      versionNo: pair.left.versionNo,
      status: pair.left.status,
      configSummary: buildMockVersionConfigSummary(policyId, pair.left),
    },
    right: {
      versionId: pair.right.versionId,
      versionNo: pair.right.versionNo,
      status: pair.right.status,
      configSummary: buildMockVersionConfigSummary(policyId, pair.right),
    },
  }
}

/**
 * mock：导出策略版本差异报告，返回下载链接
 * @param policyId - 策略 ID
 * @param anchorVersionId - 触发对比的版本 ID
 */
export function exportMockPolicyVersionDiffReport(
  policyId: string,
  anchorVersionId: string,
): PolicyVersionDiffExportResult | null {
  const diff = getMockPolicyVersionDiff(policyId, anchorVersionId)
  if (!diff) {
    return null
  }

  const reportText = [
    `策略差异报告 · ${diff.policyName}`,
    `旧版本：${diff.left.versionNo}（${diff.left.status}）`,
    `新版本：${diff.right.versionNo}（${diff.right.status}）`,
    '',
    '--- 旧版本摘要 ---',
    diff.left.configSummary,
    '',
    '--- 新版本摘要 ---',
    diff.right.configSummary,
  ].join('\n')

  const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' })
  const safeName = diff.policyName.replace(/[^\w\u4e00-\u9fa5-]+/g, '_')

  return {
    downloadUrl: URL.createObjectURL(blob),
    fileName: `${safeName}_${diff.left.versionNo}_vs_${diff.right.versionNo}_diff.txt`,
  }
}
