import request from '@/utils/request'
import { API_SUCCESS_CODE, type ApiResponse, type PageResult } from '@/types/common'
import type {
  NewReportTemplateDraftParams,
  ReportTemplate,
  ReportTemplateDetail,
  ReportTemplatePublishFailureReason,
  ReportTemplateQueryParams,
  SaveReportTemplateParams,
} from '@/types/reportTemplate'
import {
  createNewReportTemplateDetailFallback,
  newReportTemplateDraftParamsToApi,
  normalizeReportTemplate,
  normalizeReportTemplateDetail,
  normalizeReportTemplatePage,
  normalizeReportTemplatePublishFailureReason,
  reportTemplateQueryParamsToApi,
  saveReportTemplateParamsToApi,
} from '@/utils/reportAdapter'

/** 新建模板在编辑器内的占位 ID（首次保存走 POST 而非 PUT） */
const NEW_TEMPLATE_ID = 'new'

/**
 * 获取报告模板列表（分页 + 筛选）
 * @param params - 分页与筛选参数
 */
export async function getReportTemplateList(
  params: ReportTemplateQueryParams,
): Promise<ApiResponse<PageResult<ReportTemplate>>> {
  const res = await request.get<ApiResponse<unknown>>('/api/report-templates', {
    params: reportTemplateQueryParamsToApi(params),
  })
  return { ...res, data: normalizeReportTemplatePage(res.data ?? res) }
}

/**
 * 获取新建模板编辑器草稿详情（弹窗确认后、首次保存前）
 * @param draft - 模板名称与复制来源
 * 后端返回空内容时回落到空白模板详情，避免编辑器卡在加载失败态
 */
export async function getNewReportTemplateEditorDetail(
  draft: NewReportTemplateDraftParams,
): Promise<ApiResponse<ReportTemplateDetail>> {
  const res = await request.post<ApiResponse<unknown>>(
    '/api/report-templates/draft-preview',
    newReportTemplateDraftParamsToApi(draft),
  )
  const detail = normalizeReportTemplateDetail(res.data, NEW_TEMPLATE_ID)
  return {
    ...res,
    data: detail
      ? { ...detail, templateId: NEW_TEMPLATE_ID }
      : createNewReportTemplateDetailFallback(draft),
  }
}

/**
 * 保存报告模板（新建 templateId=new 或更新已有模板）
 * @param templateId - 模板 ID，新建传 new
 * @param data - 基本信息、Markdown（英文 varKey）、导出与权限
 */
export async function saveReportTemplate(
  templateId: string,
  data: SaveReportTemplateParams,
): Promise<ApiResponse<ReportTemplateDetail>> {
  const body = saveReportTemplateParamsToApi(data)
  const res =
    templateId === NEW_TEMPLATE_ID
      ? await request.post<ApiResponse<unknown>>('/api/report-templates', body)
      : await request.put<ApiResponse<unknown>>(`/api/report-templates/${templateId}`, body)

  const detail = normalizeReportTemplateDetail(res.data, templateId)
  return {
    ...res,
    // 后端保存接口可能只回 id 或空对象，这里用提交内容回填，保证返回类型完整
    data: detail ?? {
      ...createNewReportTemplateDetailFallback({ templateName: data.templateName }),
      templateId,
      version: data.version,
      outputFormat: data.outputFormat,
      visibility: data.visibility,
      projectId: data.projectId,
      isDefault: data.isDefault,
      markdownContent: data.markdownContent,
    },
  }
}

/**
 * 获取报告模板详情（编辑器页加载基本信息与 Markdown 正文）
 * @param templateId - 模板 ID
 * 模板不存在 / 加载失败时返回 data=null（错误提示已由拦截器弹出），
 * 页面据此展示「无法加载模板」结果页
 */
export async function getReportTemplateDetail(
  templateId: string,
): Promise<ApiResponse<ReportTemplateDetail | null>> {
  try {
    const res = await request.get<ApiResponse<unknown>>(`/api/report-templates/${templateId}`)
    return { ...res, data: normalizeReportTemplateDetail(res.data, templateId) }
  } catch {
    return { code: API_SUCCESS_CODE, message: '模板不存在或加载失败', data: null }
  }
}

/**
 * 发布报告模板（草稿 → 已发布）
 * @param templateId - 模板 ID
 * 「系统内置不可发布」「仅草稿可发布」等校验由后端返回业务错误
 */
export async function publishReportTemplate(
  templateId: string,
): Promise<ApiResponse<ReportTemplate>> {
  const res = await request.post<ApiResponse<unknown>>(
    `/api/report-templates/${templateId}/publish`,
  )
  return { ...res, data: normalizeReportTemplate((res.data ?? {}) as Record<string, unknown>) }
}

/**
 * 删除报告模板（系统内置不可删）
 * @param templateId - 模板 ID
 */
export async function deleteReportTemplate(templateId: string): Promise<ApiResponse<null>> {
  const res = await request.delete<ApiResponse<unknown>>(`/api/report-templates/${templateId}`)
  return { ...res, data: null }
}

/**
 * 取消发布报告模板（已发布 → 草稿）
 * @param templateId - 模板 ID
 */
export async function unpublishReportTemplate(
  templateId: string,
): Promise<ApiResponse<ReportTemplate>> {
  const res = await request.post<ApiResponse<unknown>>(
    `/api/report-templates/${templateId}/unpublish`,
  )
  return { ...res, data: normalizeReportTemplate((res.data ?? {}) as Record<string, unknown>) }
}

/**
 * 获取报告模板发布失败原因
 * @param templateId - 模板 ID
 */
export async function getReportTemplatePublishFailureReason(
  templateId: string,
): Promise<ApiResponse<ReportTemplatePublishFailureReason>> {
  const res = await request.get<ApiResponse<unknown>>(
    `/api/report-templates/${templateId}/publish-failure-reason`,
  )
  return { ...res, data: normalizeReportTemplatePublishFailureReason(res.data, templateId) }
}
