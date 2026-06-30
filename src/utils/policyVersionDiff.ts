import type { PolicyVersionListItem } from '@/types/policy'

/** 策略版本差异对比的一侧（旧版或新版） */
export interface PolicyVersionDiffSideView {
  versionId: string
  versionNo: string
  status: PolicyVersionListItem['status']
  configSummary: string
}

/** 前端展示用的差异对比结果 */
export interface PolicyVersionDiffView {
  policyId: string
  policyName: string
  left: PolicyVersionDiffSideView
  right: PolicyVersionDiffSideView
}

/**
 * 按版本行状态解析差异对比的左右版本
 * - 待审批：已发布 vs 待审批
 * - 历史：该历史 vs 已发布
 * - 已发布：已发布 vs 待审批；无待审批则 vs 最新历史
 */
export function resolvePolicyVersionDiffPair(
  anchor: PolicyVersionListItem,
  allVersions: PolicyVersionListItem[],
): { left: PolicyVersionListItem; right: PolicyVersionListItem } | null {
  const published = allVersions.find((item) => item.status === 'published')
  const pending = allVersions.find((item) => item.status === 'pending')
  const latestHistory = allVersions
    .filter((item) => item.status === 'history')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]

  if (anchor.status === 'pending') {
    if (!published) {
      return null
    }
    return { left: published, right: anchor }
  }

  if (anchor.status === 'history') {
    if (!published) {
      return null
    }
    return { left: anchor, right: published }
  }

  if (pending) {
    return { left: anchor, right: pending }
  }

  if (latestHistory) {
    return { left: latestHistory, right: anchor }
  }

  return null
}
