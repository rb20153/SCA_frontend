import type {
  PolicyConfigParseFailure,
  PolicyConfigParseResult,
  PolicyEditorConfig,
} from '@/types/policy'

/** 策略编辑器允许的根级字段 */
export const POLICY_EDITOR_ROOT_KEYS = [
  'name',
  'similarity_threshold',
  'min_match_len',
  'excluded_folders',
  'retry',
  'output_format',
] as const

/** retry 对象允许的字段 */
const RETRY_KEYS = ['enabled', 'count'] as const

/** output_format 仅允许的取值 */
const OUTPUT_FORMAT_VALUES = ['json', 'yaml'] as const

/** similarity_threshold 取值范围（0–1 的相似度比例） */
const SIMILARITY_THRESHOLD_RANGE = { min: 0, max: 1 } as const

/**
 * 解析策略编辑器 JSON 文本并校验结构与字段类型
 * @param raw - 编辑器中的 JSON 文本
 */
export function parsePolicyEditorConfig(raw: string): PolicyConfigParseResult {
  const trimmed = raw.trim()
  if (!trimmed) {
    return buildSchemaFailure('配置为空', '请填写完整的 JSON 配置对象。', [
      '配置需以 { 开头、以 } 结尾',
      '可参考右侧默认模板补全字段',
    ])
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'JSON 语法错误'
    return buildSyntaxFailure(detail)
  }

  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return buildSchemaFailure(
      '根节点必须是对象',
      '策略配置需为 JSON 对象（键值对），不能是数组或 null。',
      ['请使用 { "name": "...", ... } 形式'],
    )
  }

  const record = parsed as Record<string, unknown>
  const unknownKeys = Object.keys(record).filter(
    (key) => !POLICY_EDITOR_ROOT_KEYS.includes(key as (typeof POLICY_EDITOR_ROOT_KEYS)[number]),
  )
  if (unknownKeys.length > 0) {
    return buildSchemaFailure(
      '存在未识别的字段',
      `以下字段不在策略配置规范内：${unknownKeys.join('、')}`,
      [
        `仅支持：${POLICY_EDITOR_ROOT_KEYS.join('、')}`,
        '请删除多余字段或修正拼写（如 similarity_threshold）',
      ],
    )
  }

  const nameResult = readStringField(record, 'name', false)
  if (!nameResult.ok) {
    return nameResult.failure
  }

  const thresholdResult = readNumberField(
    record,
    'similarity_threshold',
    true,
    SIMILARITY_THRESHOLD_RANGE,
  )
  if (!thresholdResult.ok) {
    return thresholdResult.failure
  }

  const minLenResult = readNumberField(record, 'min_match_len', true)
  if (!minLenResult.ok) {
    return minLenResult.failure
  }

  const foldersResult = readStringArrayField(record, 'excluded_folders', true)
  if (!foldersResult.ok) {
    return foldersResult.failure
  }

  const retryResult = readRetryField(record.retry)
  if (!retryResult.ok) {
    return retryResult.failure
  }

  const outputResult = readStringField(record, 'output_format', true)
  if (!outputResult.ok) {
    return outputResult.failure
  }
  if (
    !OUTPUT_FORMAT_VALUES.includes(
      outputResult.value as (typeof OUTPUT_FORMAT_VALUES)[number],
    )
  ) {
    return buildSchemaFailure(
      '字段值不合法：output_format',
      `"output_format" 只能是 ${OUTPUT_FORMAT_VALUES.join(' 或 ')}。`,
      ['正确示例："json" 或 "yaml"', '注意需为小写并加双引号'],
    )
  }

  return {
    ok: true,
    config: {
      name: nameResult.value,
      similarity_threshold: thresholdResult.value,
      min_match_len: minLenResult.value,
      excluded_folders: foldersResult.value,
      retry: retryResult.value,
      output_format: outputResult.value as (typeof OUTPUT_FORMAT_VALUES)[number],
    },
  }
}

/** 构建语法错误结果 */
function buildSyntaxFailure(message: string): PolicyConfigParseFailure {
  return {
    ok: false,
    errorType: 'syntax',
    title: 'JSON 解析失败',
    message,
    hints: [
      '检查是否缺少 { }、[ ] 或引号',
      '键名与字符串值需使用双引号',
      '最后一项后不要多余逗号',
    ],
  }
}

/** 构建结构/类型错误结果 */
function buildSchemaFailure(
  title: string,
  message: string,
  hints: string[],
): PolicyConfigParseFailure {
  return {
    ok: false,
    errorType: 'schema',
    title,
    message,
    hints,
  }
}

function readStringField(
  record: Record<string, unknown>,
  key: string,
  required: boolean,
):
  | { ok: true; value: string }
  | { ok: false; failure: PolicyConfigParseFailure } {
  const value = record[key]
  if (value === undefined) {
    if (required) {
      return {
        ok: false,
        failure: buildSchemaFailure(
          `缺少字段 ${key}`,
          `配置中必须包含 "${key}" 字段。`,
          ['请对照模板补全该字段'],
        ),
      }
    }
    return { ok: true, value: '' }
  }
  if (typeof value !== 'string') {
    return {
      ok: false,
      failure: buildSchemaFailure(
        `字段类型错误：${key}`,
        `"${key}" 应为字符串。`,
        ['请为文本值加上双引号，例如 "json"'],
      ),
    }
  }
  return { ok: true, value: value }
}

function readNumberField(
  record: Record<string, unknown>,
  key: string,
  required: boolean,
  range?: { min: number; max: number },
):
  | { ok: true; value: number }
  | { ok: false; failure: PolicyConfigParseFailure } {
  const value = record[key]
  if (value === undefined) {
    if (required) {
      return {
        ok: false,
        failure: buildSchemaFailure(
          `缺少字段 ${key}`,
          `配置中必须包含 "${key}" 字段。`,
          ['请填写数字类型数值'],
        ),
      }
    }
    return { ok: true, value: 0 }
  }
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return {
      ok: false,
      failure: buildSchemaFailure(
        `字段类型错误：${key}`,
        `"${key}" 应为数字，不能是字符串或 null。`,
        ['正确示例：0.85、50', '错误示例："0.85"'],
      ),
    }
  }
  // 数值范围校验（如相似度阈值需落在 0–1 之间）
  if (range && (value < range.min || value > range.max)) {
    return {
      ok: false,
      failure: buildSchemaFailure(
        `字段超出范围：${key}`,
        `"${key}" 需为 ${range.min}–${range.max} 之间的数字，当前为 ${value}。`,
        [`正确示例：${range.min}、0.85、${range.max}`],
      ),
    }
  }
  return { ok: true, value: value }
}

function readStringArrayField(
  record: Record<string, unknown>,
  key: string,
  required: boolean,
):
  | { ok: true; value: string[] }
  | { ok: false; failure: PolicyConfigParseFailure } {
  const value = record[key]
  if (value === undefined) {
    if (required) {
      return {
        ok: false,
        failure: buildSchemaFailure(
          `缺少字段 ${key}`,
          `配置中必须包含 "${key}" 数组。`,
          ['示例：["build/", "node_modules/"]'],
        ),
      }
    }
    return { ok: true, value: [] }
  }
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    return {
      ok: false,
      failure: buildSchemaFailure(
        `字段类型错误：${key}`,
        `"${key}" 应为字符串数组。`,
        ['每一项需用双引号包裹，例如 "build/"'],
      ),
    }
  }
  return { ok: true, value: [...value] }
}

function readRetryField(
  value: unknown,
):
  | { ok: true; value: PolicyEditorConfig['retry'] }
  | { ok: false; failure: PolicyConfigParseFailure } {
  if (value === undefined) {
    return {
      ok: false,
      failure: buildSchemaFailure(
        '缺少字段 retry',
        '配置中必须包含 "retry" 对象。',
        ['需包含 enabled（布尔）与 count（数字）'],
      ),
    }
  }
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return {
      ok: false,
      failure: buildSchemaFailure(
        '字段类型错误：retry',
        '"retry" 应为对象。',
        ['示例：{ "enabled": true, "count": 3 }'],
      ),
    }
  }

  const retry = value as Record<string, unknown>
  const unknownKeys = Object.keys(retry).filter(
    (key) => !RETRY_KEYS.includes(key as (typeof RETRY_KEYS)[number]),
  )
  if (unknownKeys.length > 0) {
    return {
      ok: false,
      failure: buildSchemaFailure(
        'retry 存在未识别字段',
        `retry 内仅支持 enabled、count，发现：${unknownKeys.join('、')}`,
        ['请删除 retry 中的多余字段'],
      ),
    }
  }

  if (typeof retry.enabled !== 'boolean') {
    return {
      ok: false,
      failure: buildSchemaFailure(
        '字段类型错误：retry.enabled',
        '"retry.enabled" 应为 true 或 false（布尔值，不加引号）。',
        ['正确：true', '错误："true"'],
      ),
    }
  }

  if (typeof retry.count !== 'number' || Number.isNaN(retry.count)) {
    return {
      ok: false,
      failure: buildSchemaFailure(
        '字段类型错误：retry.count',
        '"retry.count" 应为数字。',
        ['示例：3'],
      ),
    }
  }

  return {
    ok: true,
    value: {
      enabled: retry.enabled,
      count: retry.count,
    },
  }
}
