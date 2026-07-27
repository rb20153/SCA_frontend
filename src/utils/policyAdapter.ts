import type { Policy } from '@/types/policy'
import type { PolicyDetectParams } from '@/types/policy'
import { normalizeList } from '@/utils/pageResultAdapter'

/** 将后端策略选项规范为前端 Policy */
export function normalizePolicy(raw: Record<string, unknown>): Policy {
  return {
    policyId: String(raw.policyId ?? raw.id ?? ''),
    policyName: String(raw.policyName ?? raw.name ?? ''),
    scenarioDescription: String(raw.scenarioDescription ?? raw.description ?? raw.scenario ?? ''),
    referencedProjectCount: Number(raw.referencedProjectCount ?? raw.projectCount ?? 0),
    isDefault: Boolean(raw.isDefault ?? raw.default ?? false),
    updatedAt: String(raw.updatedAt ?? ''),
  }
}

/** 规范策略下拉列表 */
export function normalizePolicyList(raw: unknown): Policy[] {
  return normalizeList(raw, normalizePolicy)
}

/** 将 0–1 小数或 0–100 整数统一为前端表单使用的 0–100 阈值 */
function normalizeSimilarityThresholdPercent(raw: unknown): number {
  const value = Number(raw)
  if (Number.isNaN(value)) return NaN
  if (value > 0 && value <= 1) {
    return Math.round(value * 1000) / 10
  }
  return value
}

/** 解析最小匹配长度：后端可能放在 minMatchLines，minMatchLength 为 0 占位 */
function normalizeMinMatchLength(obj: Record<string, unknown>): number {
  const direct = Number(obj.minMatchLength ?? obj.min_match_length ?? obj.minMatchLen)
  if (!Number.isNaN(direct) && direct > 0) {
    return direct
  }
  const lines = Number(obj.minMatchLines ?? obj.min_match_lines)
  if (!Number.isNaN(lines) && lines > 0) {
    return lines
  }
  const tokens = Number(obj.minMatchTokens ?? obj.min_match_tokens)
  if (!Number.isNaN(tokens) && tokens > 0) {
    return tokens
  }
  return Number.isNaN(direct) ? NaN : direct
}

/** 解析排除目录：后端常用 excludeDirs，契约字段为 excludeDirectories */
function normalizeExcludeDirectories(obj: Record<string, unknown>): string[] {
  const candidates = [
    obj.excludeDirectories,
    obj.excludeDirs,
    obj.exclude_directories,
    obj.excludedFolders,
  ]
  for (const item of candidates) {
    if (Array.isArray(item) && item.length > 0) {
      return item.map((dir) => String(dir))
    }
  }
  return []
}

/** 将后端策略检测参数规范为 PolicyDetectParams */
export function normalizePolicyDetectParams(raw: unknown): PolicyDetectParams | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>

  const similarityThreshold = normalizeSimilarityThresholdPercent(
    obj.similarityThreshold ?? obj.similarity_threshold ?? obj.suspectThreshold ?? obj.threshold,
  )
  const minMatchLength = normalizeMinMatchLength(obj)
  const excludeDirectories = normalizeExcludeDirectories(obj)

  if (Number.isNaN(similarityThreshold) || Number.isNaN(minMatchLength)) {
    return null
  }

  return {
    similarityThreshold,
    minMatchLength,
    excludeDirectories,
  }
}
