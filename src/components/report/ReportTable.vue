<template>
  <ListTable
    :columns="columns"
    :data-source="reports"
    :loading="loading"
    :pagination="pagination"
    :scroll-x="REPORT_TABLE_SCROLL_X"
    row-key="reportId"
  >
    <template #bodyCell="{ column, record: row, text }">
      <template v-if="column.key === 'generatedAt'">
        {{ formatReportDate(getReport(row).generatedAt) }}
      </template>

      <template v-else-if="column.key === 'status'">
        <a-tag :color="REPORT_STATUS_COLOR[getReport(row).status]" class="list-table-status-tag">
          {{ REPORT_STATUS_LABEL[getReport(row).status] }}
        </a-tag>
      </template>

      <template v-else-if="column.key === 'action'">
        <ReportActionCell
          :report="getReport(row)"
          :download-checking="downloadChecking"
          @delete="(report) => emit('delete', report)"
          @failure-reason="(report) => emit('failure-reason', report)"
          @download="(report) => emit('download', report)"
          @view="(report) => emit('view', report)"
        />
      </template>

      <ListTableCell v-else :column="column" :text="text" />
    </template>
  </ListTable>
</template>

<script setup lang="ts">
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue'
import type { Report } from '@/types/report'
import ListTable from '@/components/common/ListTable.vue'
import ListTableCell from '@/components/common/ListTableCell.vue'
import ReportActionCell from '@/components/report/ReportActionCell.vue'
import {
  REPORT_STATUS_COLOR,
  REPORT_STATUS_LABEL,
  REPORT_TABLE_SCROLL_X,
  formatReportDate,
} from '@/utils/reportDisplay'

defineProps<{
  reports: Report[]
  loading?: boolean
  pagination: TablePaginationConfig
  downloadChecking?: boolean
}>()

const emit = defineEmits<{
  delete: [report: Report]
  'failure-reason': [report: Report]
  download: [report: Report]
  view: [report: Report]
}>()

/** a-table bodyCell 的 record 为 unknown，收窄为 Report */
function getReport(row: unknown): Report {
  return row as Report
}

const columns: TableColumnsType<Report> = [
  { title: '报告名称', key: 'reportName', dataIndex: 'reportName', width: 180, ellipsis: true },
  { title: '检测任务', key: 'taskName', dataIndex: 'taskName', width: 160, ellipsis: true },
  { title: '关联项目', key: 'projectName', dataIndex: 'projectName', width: 160, ellipsis: true },
  { title: '使用模板', key: 'templateName', dataIndex: 'templateName', width: 160, ellipsis: true },
  { title: '生成时间', key: 'generatedAt', width: 120 },
  { title: '状态', key: 'status', width: 100 },
  { title: '操作', key: 'action', width: 220 },
]
</script>
