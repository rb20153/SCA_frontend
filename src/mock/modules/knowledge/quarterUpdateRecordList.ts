import type { ApiResponse } from '@/types/common'
import type {
  KbQuarterUpdateListQueryParams,
  KbQuarterUpdateRecord,
} from '@/types/knowledge'
import dayjs from 'dayjs'

const MOCK_QUARTER_UPDATE_RECORDS: KbQuarterUpdateRecord[] = [
  {
    recordId: 'kb-qu-001',
    projectName: 'OpenFOAM',
    quarter: '2026 Q2',
    summary: '获取更新 → v2406-rc1',
    collectMode: 'cloud_repo',
    status: 'in_progress',
    ownerName: '张三',
    updatedAt: dayjs('2026-05-28 18:30').toISOString(),
  },
  {
    recordId: 'kb-qu-002',
    projectName: 'fmt',
    quarter: '2026 Q2',
    summary: '上传源码包 v11.0.2',
    collectMode: 'upload_package',
    status: 'completed',
    ownerName: '李四',
    updatedAt: dayjs('2026-05-26 19:10').toISOString(),
  },
  {
    recordId: 'kb-qu-003',
    projectName: 'Eigen',
    quarter: '2026 Q2',
    summary: '获取更新 → 3.4.0',
    collectMode: 'cloud_repo',
    status: 'completed',
    ownerName: '张三',
    updatedAt: dayjs('2026-05-25 14:20').toISOString(),
  },
  {
    recordId: 'kb-qu-004',
    projectName: 'NVD',
    quarter: '2026 Q2',
    summary: '漏洞源增量同步',
    collectMode: 'cloud_repo',
    status: 'completed',
    ownerName: '王五',
    updatedAt: dayjs('2026-05-24 23:40').toISOString(),
  },
  {
    recordId: 'kb-qu-005',
    projectName: 'protobuf',
    quarter: '2026 Q2',
    summary: '上传源码包',
    collectMode: 'upload_package',
    status: 'failed',
    ownerName: '王五',
    updatedAt: dayjs('2026-05-25 10:00').toISOString(),
  },
  {
    recordId: 'kb-qu-006',
    projectName: 'CGAL',
    quarter: '2026 Q2',
    summary: '首次入库 · 获取更新 → 5.6',
    collectMode: 'cloud_repo',
    status: 'completed',
    ownerName: '李四',
    updatedAt: dayjs('2026-05-22 11:35').toISOString(),
  },
  {
    recordId: 'kb-qu-007',
    projectName: 'PETSc',
    quarter: '2026 Q2',
    summary: '获取更新 → 3.21.1',
    collectMode: 'cloud_repo',
    status: 'completed',
    ownerName: '张三',
    updatedAt: dayjs('2026-05-20 16:48').toISOString(),
  },
  {
    recordId: 'kb-qu-008',
    projectName: 'boost',
    quarter: '2026 Q2',
    summary: '上传源码包 v1.84.0',
    collectMode: 'upload_package',
    status: 'completed',
    ownerName: '李四',
    updatedAt: dayjs('2026-05-18 09:12').toISOString(),
  },
  {
    recordId: 'kb-qu-009',
    projectName: 'OpenFOAM',
    quarter: '2026 Q1',
    summary: '获取更新 → v2312（基线归档）',
    collectMode: 'cloud_repo',
    status: 'completed',
    ownerName: '张三',
    updatedAt: dayjs('2026-03-31 23:59').toISOString(),
  },
  {
    recordId: 'kb-qu-010',
    projectName: 'CNVD',
    quarter: '2026 Q1',
    summary: '漏洞源全量同步',
    collectMode: 'cloud_repo',
    status: 'completed',
    ownerName: '王五',
    updatedAt: dayjs('2026-03-28 20:15').toISOString(),
  },
  {
    recordId: 'kb-qu-011',
    projectName: 'Eigen',
    quarter: '2026 Q1',
    summary: '上传源码包 3.3.9',
    collectMode: 'upload_package',
    status: 'completed',
    ownerName: '李四',
    updatedAt: dayjs('2026-03-15 14:00').toISOString(),
  },
  {
    recordId: 'kb-qu-012',
    projectName: 'fmt',
    quarter: '2025 Q4',
    summary: '获取更新 → 10.2.1',
    collectMode: 'cloud_repo',
    status: 'completed',
    ownerName: '张三',
    updatedAt: dayjs('2025-12-20 10:30').toISOString(),
  },
]

/** 按筛选条件过滤季度更新记录（mock） */
function filterMockKbQuarterUpdateRecords(
  params: KbQuarterUpdateListQueryParams,
): KbQuarterUpdateRecord[] {
  const keyword = params.summaryKeyword?.trim().toLowerCase()

  return MOCK_QUARTER_UPDATE_RECORDS.filter((item) => {
    if (params.quarter && item.quarter !== params.quarter) return false
    if (params.status && item.status !== params.status) return false
    if (params.collectMode && item.collectMode !== params.collectMode) return false
    if (keyword && !item.summary.toLowerCase().includes(keyword)) return false
    return true
  }).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
}

/** mock 分页返回季度更新记录列表 */
export function getMockKbQuarterUpdateListPage(
  params: KbQuarterUpdateListQueryParams,
): { list: KbQuarterUpdateRecord[]; total: number } {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 10
  const filtered = filterMockKbQuarterUpdateRecords(params)
  const start = (page - 1) * pageSize

  return {
    list: filtered.slice(start, start + pageSize),
    total: filtered.length,
  }
}

/** 从 mock 记录中提取已有季度选项（倒序） */
export function getMockKbQuarterUpdateQuarterOptions(): string[] {
  const quarters = [...new Set(MOCK_QUARTER_UPDATE_RECORDS.map((item) => item.quarter))]
  return quarters.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
}
