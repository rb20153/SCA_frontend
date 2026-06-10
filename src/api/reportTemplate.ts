import type { ApiResponse, PageResult } from '@/types/common'
import type {
  CreateReportTemplateParams,
  ReportTemplate,
  ReportTemplatePublishFailureReason,
  ReportTemplateQueryParams,
} from '@/types/reportTemplate'
import {
  MOCK_ALL_REPORT_TEMPLATES,
  SYSTEM_REPORT_TEMPLATE_NAMES,
  getMockTemplatePublishFailureReason,
} from '@/mock/modules/report/templateList'

// TODO: replace with: import request from '@/utils/request'

const DEFAULT_PAGE_SIZE = 10

/** 系统内置模板置顶，其余按更新时间倒序 */
function sortReportTemplates(list: ReportTemplate[]): ReportTemplate[] {
  return [...list].sort((a, b) => {
    const aSystemIdx = (SYSTEM_REPORT_TEMPLATE_NAMES as readonly string[]).indexOf(a.templateName)
    const bSystemIdx = (SYSTEM_REPORT_TEMPLATE_NAMES as readonly string[]).indexOf(b.templateName)

    if (aSystemIdx >= 0 && bSystemIdx >= 0) {
      return aSystemIdx - bSystemIdx
    }
    if (aSystemIdx >= 0) return -1
    if (bSystemIdx >= 0) return 1

    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })
}

/** mock 阶段按筛选条件过滤模板列表 */
function filterMockReportTemplates(params: ReportTemplateQueryParams): ReportTemplate[] {
  let list = [...MOCK_ALL_REPORT_TEMPLATES]

  const templateName = params.templateName?.trim()
  if (templateName) {
    list = list.filter((item) => item.templateName.includes(templateName))
  }

  if (params.outputFormat) {
    list = list.filter((item) => item.outputFormat === params.outputFormat)
  }

  if (params.visibility) {
    list = list.filter((item) => item.visibility === params.visibility)
  }

  if (params.status) {
    list = list.filter((item) => item.status === params.status)
  }

  return sortReportTemplates(list)
}

/**
 * 获取报告模板列表（分页 + 筛选）
 * @param params - 分页与筛选参数
 */
export function getReportTemplateList(
  params: ReportTemplateQueryParams,
): Promise<ApiResponse<PageResult<ReportTemplate>>> {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE

  const sorted = filterMockReportTemplates(params)
  const start = (page - 1) * pageSize
  const list = sorted.slice(start, start + pageSize)

  // TODO: replace with → return request.get('/api/report-templates', { params })
  return Promise.resolve({
    code: 200,
    message: 'ok',
    data: {
      list,
      total: sorted.length,
      page,
      pageSize,
    },
  })
}

/**
 * 新建报告模板（草稿）
 * @param data - 模板名称与复制来源
 */
export function createReportTemplate(
  data: CreateReportTemplateParams,
): Promise<ApiResponse<ReportTemplate>> {
  const seq = MOCK_ALL_REPORT_TEMPLATES.length + 1
  const templateId = `tpl-${String(seq).padStart(3, '0')}`
  const copyFrom = data.copyFromTemplateId
    ? MOCK_ALL_REPORT_TEMPLATES.find((item) => item.templateId === data.copyFromTemplateId)
    : undefined

  const created: ReportTemplate = {
    templateId,
    templateName: data.templateName.trim(),
    version: copyFrom?.version ?? 'v1.0',
    outputFormat: copyFrom?.outputFormat ?? 'pdf',
    visibility: copyFrom?.visibility ?? 'project',
    isDefault: false,
    isSystem: false,
    status: 'draft',
    updatedAt: new Date().toISOString(),
  }

  MOCK_ALL_REPORT_TEMPLATES.push(created)

  // TODO: replace with → return request.post('/api/report-templates', data)
  return Promise.resolve({ code: 200, message: 'ok', data: created })
}

/**
 * 发布报告模板（草稿 → 已发布）
 * @param templateId - 模板 ID
 */
export function publishReportTemplate(
  templateId: string,
): Promise<ApiResponse<ReportTemplate>> {
  const template = MOCK_ALL_REPORT_TEMPLATES.find((item) => item.templateId === templateId)

  if (!template) {
    return Promise.reject(new Error('模板不存在'))
  }

  if (template.isSystem) {
    return Promise.reject(new Error('系统内置模板不可发布'))
  }

  if (template.status !== 'draft') {
    return Promise.reject(new Error('仅草稿状态模板可发布'))
  }

  template.status = 'published'
  template.updatedAt = new Date().toISOString()

  // TODO: replace with → return request.post(`/api/report-templates/${templateId}/publish`)
  return Promise.resolve({ code: 200, message: 'ok', data: { ...template } })
}

/**
 * 删除报告模板（系统内置不可删）
 * @param templateId - 模板 ID
 */
export function deleteReportTemplate(templateId: string): Promise<ApiResponse<null>> {
  const index = MOCK_ALL_REPORT_TEMPLATES.findIndex((item) => item.templateId === templateId)
  const target = index >= 0 ? MOCK_ALL_REPORT_TEMPLATES[index] : undefined

  if (target?.isSystem) {
    return Promise.reject(new Error('系统内置模板不可删除'))
  }

  if (index >= 0) {
    MOCK_ALL_REPORT_TEMPLATES.splice(index, 1)
  }

  // TODO: replace with → return request.delete(`/api/report-templates/${templateId}`)
  return Promise.resolve({ code: 200, message: 'ok', data: null })
}

/**
 * 取消发布报告模板（已发布 → 草稿）
 * @param templateId - 模板 ID
 */
export function unpublishReportTemplate(templateId: string): Promise<ApiResponse<ReportTemplate>> {
  const template = MOCK_ALL_REPORT_TEMPLATES.find((item) => item.templateId === templateId)

  if (!template) {
    return Promise.reject(new Error('模板不存在'))
  }

  if (template.isSystem) {
    return Promise.reject(new Error('系统内置模板不可取消发布'))
  }

  if (template.status !== 'published') {
    return Promise.reject(new Error('仅已发布模板可取消发布'))
  }

  template.status = 'draft'
  template.updatedAt = new Date().toISOString()

  // TODO: replace with → return request.post(`/api/report-templates/${templateId}/unpublish`)
  return Promise.resolve({ code: 200, message: 'ok', data: { ...template } })
}

/**
 * 获取报告模板发布失败原因
 * @param templateId - 模板 ID
 */
export function getReportTemplatePublishFailureReason(
  templateId: string,
): Promise<ApiResponse<ReportTemplatePublishFailureReason>> {
  // TODO: replace with → return request.get(`/api/report-templates/${templateId}/publish-failure-reason`)
  return Promise.resolve({
    code: 200,
    message: 'ok',
    data: {
      templateId,
      reason: getMockTemplatePublishFailureReason(templateId),
    },
  })
}
