import dayjs from 'dayjs'
import type { HistoryState, Router } from 'vue-router'
import type { Policy, PolicyImportMode, PolicyImportPrecheck, PolicyMaskingAction, PolicyRuleHitScope } from '@/types/policy'
import { createNavigationState } from '@/utils/navigation'

/** 策略列表表格横向滚动宽度 */
export const POLICY_TABLE_SCROLL_X = 1050

/** 规则命中列表表格横向滚动宽度 */
export const POLICY_RULE_HIT_TABLE_SCROLL_X = 1070

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
 * 格式化 retry.enabled 为中文展示
 * @param enabled - 是否启用自动重试
 */
export function formatPolicyRetryEnabled(enabled: boolean): string {
  return enabled ? '是' : '否'
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
  return policy ? createNavigationState({ policy }) : undefined
}

/**
 * 跳转策略编辑器
 * @param router - Vue Router 实例
 * @param policyId - 策略 ID，新建传 `new`
 * @param policy - 列表跳转时携带的策略上下文（可选）
 */
export async function navigateToPolicyEditor(
  router: Router,
  policyId: string,
  policy?: Policy,
): Promise<void> {
  const state = buildPolicyNavigationState(policy)
  await router.push({
    name: 'PolicyEditor',
    params: { policyId },
    ...(state ? { state } : {}),
  })
}

/** 策略导入模式筛选项 */
export const POLICY_IMPORT_MODE_OPTIONS: {
  value: PolicyImportMode
  label: string
}[] = [
  { value: 'create', label: '新建策略' },
  { value: 'overwrite', label: '覆盖同名策略' },
  { value: 'new-version', label: '导入为新版本' },
]

/** 策略导入前校验多选项 */
export const POLICY_IMPORT_PRECHECK_OPTIONS: {
  value: PolicyImportPrecheck
  label: string
}[] = [
  { value: 'dedup', label: '查重（名称+版本）' },
  { value: 'compatibility', label: '兼容性校验（字段/规则）' },
  { value: 'risk', label: '风险预估（导出/权限影响）' },
]

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
