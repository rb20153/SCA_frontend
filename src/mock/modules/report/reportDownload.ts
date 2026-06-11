import type {
  CreateReportDownloadParams,
  ReportDownloadApprovalState,
  ReportDownloadInfo,
  ReportDownloadStatus,
  ReportExportPolicyPreview,
} from '@/types/report'

/** 当前登录用户视角的导出策略摘要（mock 固定为检测工程师） */
export const MOCK_REPORT_EXPORT_POLICY: ReportExportPolicyPreview = {
  policyName: '航空软件标准策略',
  desensitizeRoleLabel: '检测工程师',
  desensitizeLevel: '部分脱敏',
  watermarkPreview: '机密｜zhangsan｜飞控仿真V2｜2026-05-18｜禁止外传',
}

/** 需要下载审批的报告 ID（对应原型「飞控V2周检报告」） */
const REPORT_IDS_REQUIRE_APPROVAL = new Set(['report-003'])

/** 已审批通过、可正常下载的报告 ID（演示审批通过后路径） */
const REPORT_IDS_APPROVED = new Set(['report-005'])

/** 用户提交申请后进入审批中的报告 */
const REPORT_IDS_PENDING_REVIEW = new Set<string>()

/**
 * 解析报告下载审批状态
 * @param reportId - 报告 ID
 */
function resolveApprovalState(reportId: string): ReportDownloadApprovalState {
  if (!REPORT_IDS_REQUIRE_APPROVAL.has(reportId)) {
    return 'not_required'
  }
  if (REPORT_IDS_APPROVED.has(reportId)) {
    return 'approved'
  }
  if (REPORT_IDS_PENDING_REVIEW.has(reportId)) {
    return 'pending_review'
  }
  return 'pending_submit'
}

/**
 * 获取报告下载前置状态（审批 + 导出策略摘要）
 * @param reportId - 报告 ID
 */
export function getMockReportDownloadStatus(reportId: string): ReportDownloadStatus {
  const approvalState = resolveApprovalState(reportId)
  const requiresApproval = approvalState !== 'not_required'

  return {
    reportId,
    requiresApproval,
    approvalState,
    exportPolicy: { ...MOCK_REPORT_EXPORT_POLICY },
  }
}

/**
 * 提交报告下载审批申请（mock 写入审批中状态）
 * @param reportId - 报告 ID
 */
export function submitMockReportDownloadApplication(reportId: string): void {
  if (!REPORT_IDS_REQUIRE_APPROVAL.has(reportId)) {
    return
  }
  REPORT_IDS_PENDING_REVIEW.add(reportId)
  REPORT_IDS_APPROVED.delete(reportId)
}

const FORMAT_EXT: Record<CreateReportDownloadParams['format'], string> = {
  pdf: 'pdf',
  word: 'docx',
  html: 'html',
}

/**
 * 生成 mock 下载链接与文件名
 * @param reportId - 报告 ID
 * @param reportName - 报告名称
 * @param params - 格式与是否含证据链
 */
export function createMockReportDownload(
  reportId: string,
  reportName: string,
  params: CreateReportDownloadParams,
): ReportDownloadInfo {
  const safeName = reportName.replace(/[\\/:*?"<>|]/g, '_')

  if (params.includeEvidenceChain) {
    return {
      url: `/mock/reports/${reportId}-with-evidence.zip`,
      fileName: `${safeName}.zip`,
    }
  }

  const ext = FORMAT_EXT[params.format]
  return {
    url: `/mock/reports/${reportId}.${ext}`,
    fileName: `${safeName}.${ext}`,
  }
}
