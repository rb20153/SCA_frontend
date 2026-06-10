import type { Report, ReportStatus } from '@/types/report'

interface ReportSeed {
  reportName: string
  projectName: string
  templateName: string
  generatedAt: string
  status: ReportStatus
  downloadUrl?: string
  failureReason?: string
}

const REPORT_SEEDS: ReportSeed[] = [
  {
    reportName: '飞控V2验收报告',
    projectName: '飞控仿真V2',
    templateName: '标准验收',
    generatedAt: '2026-05-18T10:00:00+08:00',
    status: 'completed',
    downloadUrl: '/mock/reports/report-001.pdf',
  },
  {
    reportName: '结构平台管理摘要',
    projectName: '结构分析平台',
    templateName: '管理摘要',
    generatedAt: '2026-05-10T14:30:00+08:00',
    status: 'generating',
  },
  {
    reportName: '飞控V2周检报告',
    projectName: '飞控仿真V2',
    templateName: '自定义 Markdown 模板',
    generatedAt: '2026-05-27T09:15:00+08:00',
    status: 'completed',
    downloadUrl: '/mock/reports/report-003.pdf',
  },
  {
    reportName: '飞控V2风险复核报告',
    projectName: '飞控仿真V2',
    templateName: '标准验收',
    generatedAt: '2026-05-01T16:20:00+08:00',
    status: 'failed',
    failureReason:
      '报告渲染引擎超时：模板变量「risk_summary」数据源未就绪，请确认关联检测任务已完成后再重试。',
  },
  {
    reportName: '仿真工具链合规报告',
    projectName: '仿真工具链',
    templateName: '管理摘要',
    generatedAt: '2026-05-22T11:40:00+08:00',
    status: 'completed',
    downloadUrl: '/mock/reports/report-005.pdf',
  },
  {
    reportName: '柔性机构扫描周报',
    projectName: '柔性机构仿真链路',
    templateName: '标准验收',
    generatedAt: '2026-05-24T08:00:00+08:00',
    status: 'failed',
    failureReason:
      '导出服务异常：Word 模板转换失败（缺少字体 simsun.ttc），请联系系统管理员处理。',
  },
]

const MOCK_REPORT_TOTAL = 24

function buildMockReports(count: number): Report[] {
  return Array.from({ length: count }, (_, index) => {
    const seed = REPORT_SEEDS[index % REPORT_SEEDS.length]
    const seq = index + 1
    const reportName = seq > REPORT_SEEDS.length ? `${seed.reportName}-${seq}` : seed.reportName

    return {
      reportId: `report-${String(seq).padStart(3, '0')}`,
      reportName,
      projectName: seed.projectName,
      templateName: seed.templateName,
      generatedAt: new Date(
        new Date(seed.generatedAt).getTime() - index * 86_400_000,
      ).toISOString(),
      status: seed.status,
      downloadUrl: seed.downloadUrl,
    }
  })
}

/** 报告列表 mock 数据源 */
export const MOCK_ALL_REPORTS: Report[] = buildMockReports(MOCK_REPORT_TOTAL)

/** 按报告名称匹配种子数据中的失败原因 */
export function getMockReportFailureReason(reportName: string): string {
  const baseName = reportName.replace(/-\d+$/, '')
  const seed = REPORT_SEEDS.find((item) => item.reportName === baseName && item.failureReason)
  return (
    seed?.failureReason ??
    '报告生成失败：关联任务结果未同步完成，或模板渲染过程中发生未知错误。'
  )
}
