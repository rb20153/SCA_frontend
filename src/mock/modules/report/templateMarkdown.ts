import { MOCK_ALL_REPORT_TEMPLATES } from '@/mock/modules/report/templateList'
import { DEFAULT_REPORT_TEMPLATE_MARKDOWN } from '@/mock/modules/report/templateVariables'

/** 管理摘要类模板 Markdown 示例 */
export const MANAGEMENT_SUMMARY_REPORT_MARKDOWN = `# $报告名称

> 管理摘要 · $项目名称 · $生成时间

## 核心指标

- 自主率：**$自主率**
- 组件总数：$组件总数
- 漏洞总数：$漏洞总数

## 风险概览

$风险摘要
`

/** 开源风险专项模板 Markdown 示例 */
export const OPEN_SOURCE_RISK_REPORT_MARKDOWN = `# $报告名称

> 项目：$项目名称 · 任务：$任务名称 · $生成时间

## 风险摘要

$风险摘要

## 组件与漏洞统计

| 指标 | 数值 |
| --- | --- |
| 组件总数 | $组件总数 |
| 漏洞总数 | $漏洞总数 |

## SBOM 变更

$SBOM差异
`

/** 结构/周报类模板 Markdown 示例 */
export const WEEKLY_STATUS_REPORT_MARKDOWN = `# $报告名称

> 周报 · $项目名称 · 责任人：$责任人

## 本周进展

- 扫描任务：$任务名称
- 自主率：**$自主率**
- 更新时间：$生成时间

## 待跟进项

1. 复核高风险组件许可证声明
2. 跟踪 $漏洞总数 个未修复漏洞
3. SBOM 差异：$SBOM差异
`

const MARKDOWN_VARIANTS = [
  DEFAULT_REPORT_TEMPLATE_MARKDOWN,
  MANAGEMENT_SUMMARY_REPORT_MARKDOWN,
  OPEN_SOURCE_RISK_REPORT_MARKDOWN,
  WEEKLY_STATUS_REPORT_MARKDOWN,
] as const

/** 按模板索引选取 Markdown 正文（保证每条 mock 模板均有内容） */
function pickMarkdownVariantForTemplate(templateId: string): string {
  const index = MOCK_ALL_REPORT_TEMPLATES.findIndex((item) => item.templateId === templateId)
  if (index < 0) {
    return DEFAULT_REPORT_TEMPLATE_MARKDOWN
  }

  const template = MOCK_ALL_REPORT_TEMPLATES[index]

  if (template.templateName.includes('管理摘要')) {
    return MANAGEMENT_SUMMARY_REPORT_MARKDOWN
  }
  if (template.templateName.includes('开源风险') || template.templateName.includes('合规')) {
    return OPEN_SOURCE_RISK_REPORT_MARKDOWN
  }
  if (template.templateName.includes('周报') || template.templateName.includes('结构')) {
    return WEEKLY_STATUS_REPORT_MARKDOWN
  }
  if (template.templateName.includes('自主率')) {
    return DEFAULT_REPORT_TEMPLATE_MARKDOWN
  }

  return MARKDOWN_VARIANTS[index % MARKDOWN_VARIANTS.length]
}

/** 初始化全部 mock 模板的 Markdown 正文 */
function buildMockTemplateMarkdownStore(): Record<string, string> {
  const store: Record<string, string> = {}
  MOCK_ALL_REPORT_TEMPLATES.forEach((template) => {
    store[template.templateId] = pickMarkdownVariantForTemplate(template.templateId)
  })
  return store
}

/** 已有模板 ID → Markdown 正文（mock 持久化；联调后由后端存储） */
const MOCK_TEMPLATE_MARKDOWN_STORE: Record<string, string> = buildMockTemplateMarkdownStore()

/**
 * 获取模板已保存的 Markdown 正文（所有 mock 模板均有内容）
 * @param templateId - 模板 ID
 */
export function getMockTemplateMarkdownContent(templateId: string): string {
  return MOCK_TEMPLATE_MARKDOWN_STORE[templateId] ?? DEFAULT_REPORT_TEMPLATE_MARKDOWN
}

/**
 * mock 写入模板 Markdown（保存接口接入前仅供演示）
 * @param templateId - 模板 ID
 * @param content - Markdown 正文
 */
export function setMockTemplateMarkdownContent(templateId: string, content: string) {
  MOCK_TEMPLATE_MARKDOWN_STORE[templateId] = content
}
