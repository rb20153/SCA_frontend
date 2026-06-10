<template>
  <ListTable
    :columns="columns"
    :data-source="templates"
    :loading="loading"
    :pagination="pagination"
    :scroll-x="REPORT_TEMPLATE_TABLE_SCROLL_X"
    row-key="templateId"
  >
    <template #bodyCell="{ column, record: row }">
      <template v-if="column.key === 'outputFormat'">
        {{ REPORT_TEMPLATE_OUTPUT_FORMAT_LABEL[getTemplate(row).outputFormat] }}
      </template>

      <template v-else-if="column.key === 'visibility'">
        {{ REPORT_TEMPLATE_VISIBILITY_LABEL[getTemplate(row).visibility] }}
      </template>

      <template v-else-if="column.key === 'isDefault'">
        <a-tag :color="getTemplate(row).isDefault ? 'blue' : 'default'" class="list-table-status-tag">
          {{ getTemplate(row).isDefault ? '是' : '否' }}
        </a-tag>
      </template>

      <template v-else-if="column.key === 'status'">
        <a-tag
          :color="REPORT_TEMPLATE_STATUS_COLOR[getTemplate(row).status]"
          class="list-table-status-tag"
        >
          {{ REPORT_TEMPLATE_STATUS_LABEL[getTemplate(row).status] }}
        </a-tag>
      </template>

      <template v-else-if="column.key === 'updatedAt'">
        {{ formatReportTemplateDate(getTemplate(row).updatedAt) }}
      </template>

      <template v-else-if="column.key === 'action'">
        <ReportTemplateActionCell
          :template="getTemplate(row)"
          @delete="(template) => emit('delete', template)"
          @publish="(template) => emit('publish', template)"
          @unpublish="(template) => emit('unpublish', template)"
          @failure-reason="(template) => emit('failure-reason', template)"
        />
      </template>
    </template>
  </ListTable>
</template>

<script setup lang="ts">
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue'
import type { ReportTemplate } from '@/types/reportTemplate'
import ListTable from '@/components/common/ListTable.vue'
import ReportTemplateActionCell from '@/components/report/ReportTemplateActionCell.vue'
import {
  REPORT_TEMPLATE_OUTPUT_FORMAT_LABEL,
  REPORT_TEMPLATE_STATUS_COLOR,
  REPORT_TEMPLATE_STATUS_LABEL,
  REPORT_TEMPLATE_TABLE_SCROLL_X,
  REPORT_TEMPLATE_VISIBILITY_LABEL,
  formatReportTemplateDate,
} from '@/utils/reportTemplateDisplay'

defineProps<{
  templates: ReportTemplate[]
  loading?: boolean
  pagination: TablePaginationConfig
}>()

const emit = defineEmits<{
  delete: [template: ReportTemplate]
  publish: [template: ReportTemplate]
  unpublish: [template: ReportTemplate]
  'failure-reason': [template: ReportTemplate]
}>()

/** a-table bodyCell 的 record 为 unknown，收窄为 ReportTemplate */
function getTemplate(row: unknown): ReportTemplate {
  return row as ReportTemplate
}

const columns: TableColumnsType<ReportTemplate> = [
  { title: '模板名称', key: 'templateName', dataIndex: 'templateName', width: 200, ellipsis: true },
  { title: '版本', key: 'version', dataIndex: 'version', width: 90 },
  { title: '输出格式', key: 'outputFormat', width: 100 },
  { title: '可见范围', key: 'visibility', width: 120 },
  { title: '默认模板', key: 'isDefault', width: 100 },
  { title: '状态', key: 'status', width: 100 },
  { title: '更新时间', key: 'updatedAt', width: 120 },
  { title: '操作', key: 'action', width: 260 },
]
</script>
