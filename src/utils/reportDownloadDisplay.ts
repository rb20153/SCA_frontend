import type { ReportDownloadFormat } from '@/types/report'

/** 报告下载格式下拉选项 */
export const REPORT_DOWNLOAD_FORMAT_OPTIONS: { label: string; value: ReportDownloadFormat }[] = [
  { label: 'PDF', value: 'pdf' },
  { label: 'Word', value: 'word' },
  { label: 'HTML', value: 'html' },
]

/** 是否包含证据链下拉选项 */
export const REPORT_EVIDENCE_CHAIN_OPTIONS = [
  { label: '是', value: true },
  { label: '否', value: false },
] as const

/** 默认下载格式 */
export const DEFAULT_REPORT_DOWNLOAD_FORMAT: ReportDownloadFormat = 'pdf'
