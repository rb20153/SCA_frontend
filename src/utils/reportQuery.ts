import type { ReportListFilters, ReportQueryParams } from '@/types/report'

/** 返回空的报告列表筛选表单 */
export function createEmptyReportListFilters(): ReportListFilters {
  return {
    reportName: '',
    projectName: '',
    generatedDate: undefined,
  }
}

/** 将表单筛选条件转为 API 查询参数（空值不传） */
export function reportListFiltersToQuery(
  filters: ReportListFilters,
): Omit<ReportQueryParams, 'page' | 'pageSize'> {
  const query: Omit<ReportQueryParams, 'page' | 'pageSize'> = {}
  const reportName = filters.reportName.trim()
  const projectName = filters.projectName.trim()

  if (reportName) query.reportName = reportName
  if (projectName) query.projectName = projectName
  if (filters.generatedDate) {
    query.generatedDate = filters.generatedDate.format('YYYY-MM-DD')
  }

  return query
}
