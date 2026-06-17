import type { ReportPreview, ReportPreviewFormat } from '@/types/report'

/** 预览示例文件（放在 public 下，开发期同源直读、无需鉴权） */
const SAMPLE_PREVIEW: Record<ReportPreviewFormat, { url: string; fileName: string }> = {
  pdf: { url: '/mock-reports/sample-report.pdf', fileName: 'SCA开源风险报告(示例).pdf' },
  html: { url: '/mock-reports/sample-report.html', fileName: 'SCA开源风险报告(示例).html' },
}

/** 根据 reportId 序号稳定地交替 PDF / HTML，保证 completed 报告也能覆盖两种预览形态 */
function pickFormat(reportId: string): ReportPreviewFormat {
  const seq = Number.parseInt(reportId.replace(/\D/g, ''), 10) || 0
  return seq % 4 === 1 ? 'pdf' : 'html'
}

/**
 * mock：获取报告在线预览信息
 * @param reportId - 报告 ID
 * @returns 预览格式与示例文件地址
 */
export function getMockReportPreview(reportId: string): ReportPreview {
  const format = pickFormat(reportId)
  const sample = SAMPLE_PREVIEW[format]
  return {
    reportId,
    format,
    url: sample.url,
    fileName: sample.fileName,
  }
}
