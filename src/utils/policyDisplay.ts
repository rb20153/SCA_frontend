import dayjs from 'dayjs'
import type { Router } from 'vue-router'
import type { Policy, PolicyMaskingAction, PolicyRuleHitScope } from '@/types/policy'

/** 策略列表表格横向滚动宽度 */
export const POLICY_TABLE_SCROLL_X = 1050

/** 规则命中列表表格横向滚动宽度 */
export const POLICY_RULE_HIT_TABLE_SCROLL_X = 1180

/** 脱敏动作展示文案 */
export const POLICY_MASKING_ACTION_LABEL: Record<PolicyMaskingAction, string> = {
  replace: '替换为 ***',
  'summary-only': '仅摘要',
  block: '阻断导出',
  watermark: '叠加水印',
}

/** 脱敏动作 Tag 颜色 */
export const POLICY_MASKING_ACTION_COLOR: Record<PolicyMaskingAction, string> = {
  replace: 'warning',
  'summary-only': 'error',
  block: 'error',
  watermark: 'processing',
}

/** 命中范围展示文案 */
export const POLICY_RULE_HIT_SCOPE_LABEL: Record<PolicyRuleHitScope, string> = {
  source: '源码',
  binary: '二进制',
  'report-export': '报告导出',
}

/**
 * 格式化策略更新时间为列表展示
 * @param value - ISO 8601 字符串
 */
export function formatPolicyDateTime(value: string): string {
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm') : '—'
}

/**
 * 格式化规则命中时间为列表展示（日期 + 时间）
 * @param value - ISO 8601 字符串
 */
export function formatPolicyRuleHitDateTime(value: string): string {
  return formatPolicyDateTime(value)
}

/**
 * 构建策略治理子页路由路径
 * @param policyId - 策略 ID
 * @param tabKey - governance | trace
 */
export function buildPolicyGovernancePath(
  policyId: string,
  tabKey: 'governance' | 'trace',
): string {
  return tabKey === 'trace'
    ? `/policies/${policyId}/trace`
    : `/policies/${policyId}/governance`
}

/**
 * 构建日志列表 TraceID 筛选跳转路径
 * @param traceId - 全链路 TraceID
 */
export function buildLogListTracePath(traceId: string): string {
  return `/system/logs?traceId=${encodeURIComponent(traceId)}`
}

/** 构建带策略上下文的 history.state（列表跳转子页用） */
export function buildPolicyNavigationState(policy?: Policy): HistoryState | undefined {
  return policy ? ({ policy } as HistoryState) : undefined
}

/**
 * 跳转策略治理子页并携带策略上下文
 * @param router - Vue Router 实例
 * @param policy - 当前策略
 * @param tabKey - governance | trace
 */
export function navigateToPolicySubPage(
  router: Router,
  policy: Policy,
  tabKey: 'governance' | 'trace',
): void {
  void router.push({
    path: buildPolicyGovernancePath(policy.policyId, tabKey),
    state: buildPolicyNavigationState(policy),
  })
}
