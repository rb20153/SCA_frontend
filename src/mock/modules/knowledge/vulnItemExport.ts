import type {
  VulnItemExportFormat,
  VulnItemExportParams,
  VulnItemExportResult,
  VulnItemListItem,
} from '@/types/knowledge'
import {
  filterMockVulnItemList,
  getMockVulnItemListPage,
} from '@/mock/modules/knowledge/vulnItemList'
import {
  VULN_ITEM_LEVEL_LABEL,
  VULN_ITEM_STATUS_LABEL,
  formatVulnItemDateTime,
} from '@/utils/vulnItemDisplay'
import dayjs from 'dayjs'

const EXPORT_MIME: Record<VulnItemExportFormat, string> = {
  csv: 'text/csv;charset=utf-8',
  excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  json: 'application/json',
}

const EXPORT_EXT: Record<VulnItemExportFormat, string> = {
  csv: 'csv',
  excel: 'xlsx',
  json: 'json',
}

/** 将条目行转为导出用扁平对象 */
function toExportRow(item: VulnItemListItem) {
  return {
    identifier: item.identifier,
    sourceName: item.sourceName,
    level: VULN_ITEM_LEVEL_LABEL[item.level],
    affectedComponent: item.affectedComponent,
    updatedAt: formatVulnItemDateTime(item.updatedAt),
    status: VULN_ITEM_STATUS_LABEL[item.status],
  }
}

/** 转义 CSV 字段 */
function escapeCsvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

/** 按格式生成导出文件内容 */
function buildExportContent(format: VulnItemExportFormat, rows: VulnItemListItem[]): string {
  const exportRows = rows.map(toExportRow)

  if (format === 'json') {
    return JSON.stringify(exportRows, null, 2)
  }

  const header = 'identifier,sourceName,level,affectedComponent,updatedAt,status'
  const delimiter = format === 'excel' ? '\t' : ','

  const body = exportRows
    .map((row) =>
      [
        row.identifier,
        row.sourceName,
        row.level,
        row.affectedComponent,
        row.updatedAt,
        row.status,
      ]
        .map((value) => (format === 'excel' ? value : escapeCsvCell(value)))
        .join(delimiter),
    )
    .join('\n')

  return format === 'excel' ? `${header.replace(/,/g, '\t')}\n${body}` : `${header}\n${body}`
}

/**
 * 生成漏洞条目导出 mock 结果（浏览器 Blob URL）
 * @param params - 筛选条件、格式与导出范围
 */
export function getMockVulnItemExportResult(params: VulnItemExportParams): VulnItemExportResult {
  const rows =
    params.scope === 'current_page'
      ? getMockVulnItemListPage({
          ...params,
          page: params.page ?? 1,
          pageSize: params.pageSize ?? 10,
        }).list
      : filterMockVulnItemList(params)

  const content = buildExportContent(params.format, rows)
  const blob = new Blob([content], { type: EXPORT_MIME[params.format] })
  const dateKey = dayjs().format('YYYYMMDD-HHmmss')

  return {
    downloadUrl: URL.createObjectURL(blob),
    fileName: `vuln-items-${dateKey}.${EXPORT_EXT[params.format]}`,
  }
}
