import dayjs from 'dayjs'
import type {
  PolicyGovernanceOverview,
  PolicyVersionApprovalConclusion,
  PolicyVersionEffectiveTime,
  PolicyVersionExportFormat,
  PolicyVersionExportScope,
  PolicyVersionStatus,
} from '@/types/policy'
import type { StatCardItem } from '@/types/common'
import { formatPolicyDateTime } from '@/utils/policyDisplay'

/** 策略版本列表表格横向滚动宽度 */
export const POLICY_VERSION_TABLE_SCROLL_X = 980

/** 策略版本状态展示文案 */
export const POLICY_VERSION_STATUS_LABEL: Record<PolicyVersionStatus, string> = {
  published: '已发布',
  pending: '待审批',
  history: '历史',
}

/** 策略版本状态 Tag 颜色 */
export const POLICY_VERSION_STATUS_COLOR: Record<PolicyVersionStatus, string> = {
  published: 'success',
  pending: 'processing',
  history: 'default',
}

/**
 * 格式化策略版本创建时间为列表展示（日期 + 时间）
 * @param value - ISO 8601 字符串
 */
export function formatPolicyVersionDateTime(value: string): string {
  return formatPolicyDateTime(value)
}

/**
 * 将策略版本概览转为 StatCardRow 数据
 * @param overview - 版本与审批页概览
 */
export function mapPolicyGovernanceToStatCards(
  overview: PolicyGovernanceOverview,
): StatCardItem[] {
  return [
    { key: 'policyName', label: '策略名', value: overview.policyName },
    { key: 'currentVersion', label: '当前生效版本', value: overview.currentVersion },
    {
      key: 'pendingCount',
      label: '待审批',
      value: String(overview.pendingCount),
      warnValue: overview.pendingCount > 0,
    },
    {
      key: 'lastChangedAt',
      label: '最近变更',
      value: formatPolicyVersionDateTime(overview.lastChangedAt),
    },
  ]
}

/**
 * 解析策略版本号为可比较的数值段（去掉前缀 v/V）
 * @param versionNo - 如 v2.3.1
 */
function parsePolicyVersionParts(versionNo: string): number[] {
  const normalized = versionNo.trim().replace(/^[vV]/, '')
  if (!normalized) {
    return []
  }

  return normalized.split(/[.-]/).map((part) => {
    const numeric = Number.parseInt(part.replace(/\D/g, ''), 10)
    return Number.isNaN(numeric) ? 0 : numeric
  })
}

/**
 * 比较两个策略版本号大小
 * @returns 正数表示 left 更大，负数表示 left 更小，0 表示相等
 */
export function comparePolicyVersion(left: string, right: string): number {
  const leftParts = parsePolicyVersionParts(left)
  const rightParts = parsePolicyVersionParts(right)
  const maxLen = Math.max(leftParts.length, rightParts.length)

  for (let index = 0; index < maxLen; index += 1) {
    const leftValue = leftParts[index] ?? 0
    const rightValue = rightParts[index] ?? 0
    if (leftValue !== rightValue) {
      return leftValue - rightValue
    }
  }

  return 0
}

/**
 * 校验新版本号是否严格大于当前生效版本
 * @param nextVersion - 用户输入的新版本号
 * @param currentVersion - 当前生效版本；为空时不校验大小
 */
export function isPolicyVersionGreaterThan(
  nextVersion: string,
  currentVersion: string | null | undefined,
): boolean {
  const trimmed = nextVersion.trim()
  if (!trimmed) {
    return false
  }

  if (!currentVersion?.trim()) {
    return true
  }

  return comparePolicyVersion(trimmed, currentVersion) > 0
}

/**
 * 校验版本号格式（允许 v 前缀与点分段）
 * @param versionNo - 用户输入
 */
export function isValidPolicyVersionFormat(versionNo: string): boolean {
  const trimmed = versionNo.trim()
  if (!trimmed) {
    return false
  }

  return /^[vV]?\d+(?:[.-]\d+)*$/.test(trimmed)
}

/**
 * 格式化最近变更时间为概览展示（无效时返回占位符）
 * @param value - ISO 8601 字符串
 */
export function formatPolicyGovernanceLastChanged(value: string): string {
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm') : '—'
}

/** 策略版本审批结论选项 */
export const POLICY_VERSION_APPROVAL_CONCLUSION_OPTIONS: {
  value: PolicyVersionApprovalConclusion
  label: string
}[] = [
  { value: 'approved', label: '通过' },
  { value: 'rejected', label: '驳回' },
]

/** 策略版本审批生效时间选项 */
export const POLICY_VERSION_EFFECTIVE_TIME_OPTIONS: {
  value: PolicyVersionEffectiveTime
  label: string
}[] = [
  { value: 'immediate', label: '立即生效' },
  { value: 'next-window', label: '下次发布窗口' },
]

/** 策略版本导出范围选项 */
export const POLICY_VERSION_EXPORT_SCOPE_OPTIONS: {
  value: PolicyVersionExportScope
  label: string
}[] = [
  { value: 'params-and-rules', label: '策略参数 + 规则集' },
  { value: 'params-only', label: '仅策略参数' },
  { value: 'rules-only', label: '仅规则集' },
]

/** 策略版本导出格式选项 */
export const POLICY_VERSION_EXPORT_FORMAT_OPTIONS: {
  value: PolicyVersionExportFormat
  label: string
}[] = [
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
]
