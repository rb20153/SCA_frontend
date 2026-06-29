import type { ReportTemplateExportSettings } from '@/types/reportTemplate'
import { createDefaultReportTemplateExportSettings } from '@/utils/reportTemplateExportDisplay'

/** 按模板 ID 的差异化 mock（编辑态演示不同配置） */
const MOCK_EXPORT_OVERRIDES: Record<string, Partial<ReportTemplateExportSettings>> = {
  'tpl-002': {
    exportRequiresApproval: false,
    watermarkEnabled: false,
    downloadScope: 'all',
  },
  'tpl-004': {
    allowedFormats: ['pdf', 'html'],
    linkValidity: '7d',
    sensitiveFields: ['token', 'email'],
  },
  'tpl-005': {
    exportRequiresApproval: true,
    watermarkContent: '内部资料｜{user}｜{project}',
    downloadScope: 'creator_owner',
  },
}

/** 初始化全部 mock 模板的导出配置 */
function buildMockExportSettingsStore(): Record<string, ReportTemplateExportSettings> {
  const store: Record<string, ReportTemplateExportSettings> = {}
  const templateIds = Array.from({ length: 18 }, (_, index) => `tpl-${String(index + 1).padStart(3, '0')}`)

  templateIds.forEach((templateId) => {
    const base = createDefaultReportTemplateExportSettings()
    const override = MOCK_EXPORT_OVERRIDES[templateId]
    store[templateId] = override
      ? {
          ...base,
          ...override,
          roleRules: base.roleRules,
        }
      : base
  })

  return store
}

const MOCK_TEMPLATE_EXPORT_STORE = buildMockExportSettingsStore()

/**
 * 获取模板导出与权限 mock 配置
 * @param templateId - 模板 ID
 */
export function getMockTemplateExportSettings(templateId: string): ReportTemplateExportSettings {
  const stored = MOCK_TEMPLATE_EXPORT_STORE[templateId]
  if (!stored) {
    return createDefaultReportTemplateExportSettings()
  }
  return {
    ...stored,
    roleRules: stored.roleRules.map((item) => ({ ...item })),
    sensitiveFields: [...stored.sensitiveFields],
    allowedFormats: [...stored.allowedFormats],
  }
}

/**
 * mock 写入模板导出配置（保存接口接入前）
 * @param templateId - 模板 ID
 * @param settings - 导出与权限
 */
export function setMockTemplateExportSettings(
  templateId: string,
  settings: ReportTemplateExportSettings,
) {
  MOCK_TEMPLATE_EXPORT_STORE[templateId] = {
    ...settings,
    roleRules: settings.roleRules.map((item) => ({ ...item })),
    sensitiveFields: [...settings.sensitiveFields],
    allowedFormats: [...settings.allowedFormats],
  }
}
