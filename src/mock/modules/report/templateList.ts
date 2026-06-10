import type { ReportTemplate, ReportTemplateStatus } from '@/types/reportTemplate'

/** 系统内置模板名称（列表置顶且不可操作） */
export const SYSTEM_REPORT_TEMPLATE_NAMES = ['标准验收报告', '管理摘要报告'] as const

interface TemplateSeed {
  templateName: string
  version: string
  outputFormat: ReportTemplate['outputFormat']
  visibility: ReportTemplate['visibility']
  isDefault: boolean
  isSystem: boolean
  status: ReportTemplateStatus
  updatedAt: string
  publishFailureReason?: string
}

const TEMPLATE_SEEDS: TemplateSeed[] = [
  {
    templateName: '标准验收报告',
    version: 'v1.0',
    outputFormat: 'pdf',
    visibility: 'global',
    isDefault: true,
    isSystem: true,
    status: 'published',
    updatedAt: '2026-05-01T10:00:00+08:00',
  },
  {
    templateName: '管理摘要报告',
    version: 'v1.0',
    outputFormat: 'pdf',
    visibility: 'global',
    isDefault: false,
    isSystem: true,
    status: 'published',
    updatedAt: '2026-05-01T10:00:00+08:00',
  },
  {
    templateName: '飞控项目自定义验收模板',
    version: 'v1.2',
    outputFormat: 'pdf',
    visibility: 'project',
    isDefault: false,
    isSystem: false,
    status: 'published',
    updatedAt: '2026-05-18T14:30:00+08:00',
  },
  {
    templateName: '结构平台周报模板',
    version: 'v0.9',
    outputFormat: 'word',
    visibility: 'project',
    isDefault: false,
    isSystem: false,
    status: 'draft',
    updatedAt: '2026-05-20T09:15:00+08:00',
  },
  {
    templateName: '仿真工具链合规模板',
    version: 'v1.0',
    outputFormat: 'html',
    visibility: 'private',
    isDefault: false,
    isSystem: false,
    status: 'publish_failed',
    updatedAt: '2026-05-22T11:40:00+08:00',
    publishFailureReason:
      '模板校验失败：变量 $risk_summary 无对应数据源映射，请检查 Markdown 中的变量占位符后重新发布。',
  },
  {
    templateName: '柔性机构扫描模板',
    version: 'v1.1',
    outputFormat: 'pdf',
    visibility: 'project',
    isDefault: false,
    isSystem: false,
    status: 'draft',
    updatedAt: '2026-05-24T08:00:00+08:00',
  },
  {
    templateName: '开源风险专项模板',
    version: 'v2.0',
    outputFormat: 'pdf',
    visibility: 'global',
    isDefault: false,
    isSystem: false,
    status: 'published',
    updatedAt: '2026-05-25T16:20:00+08:00',
  },
  {
    templateName: '自主率复核模板',
    version: 'v1.0',
    outputFormat: 'word',
    visibility: 'private',
    isDefault: false,
    isSystem: false,
    status: 'publish_failed',
    updatedAt: '2026-05-26T10:05:00+08:00',
    publishFailureReason:
      '发布服务异常：Word 模板转换引擎缺少 simsun.ttc 字体，请联系系统管理员处理后重试。',
  },
]

const MOCK_TEMPLATE_TOTAL = 18

/** 发布失败原因索引（按模板 ID 或名称） */
const publishFailureReasonMap = new Map<string, string>()

function buildMockTemplates(count: number): ReportTemplate[] {
  return Array.from({ length: count }, (_, index) => {
    const seed = TEMPLATE_SEEDS[index % TEMPLATE_SEEDS.length]
    const seq = index + 1
    const templateId = `tpl-${String(seq).padStart(3, '0')}`
    const templateName =
      seq > TEMPLATE_SEEDS.length ? `${seed.templateName}-${seq}` : seed.templateName
    const isSystem = seq <= SYSTEM_REPORT_TEMPLATE_NAMES.length

    if (seed.publishFailureReason) {
      publishFailureReasonMap.set(templateId, seed.publishFailureReason)
      publishFailureReasonMap.set(templateName, seed.publishFailureReason)
    }

    return {
      templateId,
      templateName: isSystem ? SYSTEM_REPORT_TEMPLATE_NAMES[seq - 1] : templateName,
      version: seed.version,
      outputFormat: seed.outputFormat,
      visibility: seed.visibility,
      isDefault: seed.isDefault && isSystem && seq === 1,
      isSystem,
      status: isSystem ? 'published' : seed.status,
      updatedAt: new Date(
        new Date(seed.updatedAt).getTime() - index * 43_200_000,
      ).toISOString(),
    }
  })
}

/** 报告模板列表 mock 数据源 */
export const MOCK_ALL_REPORT_TEMPLATES: ReportTemplate[] = buildMockTemplates(MOCK_TEMPLATE_TOTAL)

/** 获取模板发布失败原因 */
export function getMockTemplatePublishFailureReason(templateId: string): string {
  const template = MOCK_ALL_REPORT_TEMPLATES.find((item) => item.templateId === templateId)
  if (!template) {
    return '未找到该模板的发布失败原因'
  }

  return (
    publishFailureReasonMap.get(templateId) ??
    publishFailureReasonMap.get(template.templateName) ??
    '模板发布失败：渲染引擎校验未通过，请检查变量占位符与章节结构后重新发布。'
  )
}
