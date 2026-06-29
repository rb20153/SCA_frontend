<template>
  <ListTable
    :columns="columns"
    :data-source="rules"
    row-key="roleKey"
    :pagination="false"
  >
    <template #bodyCell="{ column, record: row }">
      <template v-if="column.key === 'exportLevel'">
        <a-tag
          :color="REPORT_TEMPLATE_EXPORT_LEVEL_COLOR[getRule(row).exportLevel]"
          class="list-table-status-tag"
        >
          {{ REPORT_TEMPLATE_EXPORT_LEVEL_LABEL[getRule(row).exportLevel] }}
        </a-tag>
      </template>
    </template>
  </ListTable>
</template>

<script setup lang="ts">
import type { TableColumnsType } from 'ant-design-vue'
import ListTable from '@/components/common/ListTable.vue'
import type { ReportTemplateRoleDesensitizeRule } from '@/types/reportTemplate'
import {
  REPORT_TEMPLATE_EXPORT_LEVEL_COLOR,
  REPORT_TEMPLATE_EXPORT_LEVEL_LABEL,
} from '@/utils/reportTemplateExportDisplay'

defineProps<{
  /** 按角色脱敏规则（只读） */
  rules: ReportTemplateRoleDesensitizeRule[]
}>()

/** a-table bodyCell 的 record 收窄为规则项 */
function getRule(row: unknown): ReportTemplateRoleDesensitizeRule {
  return row as ReportTemplateRoleDesensitizeRule
}

const columns: TableColumnsType<ReportTemplateRoleDesensitizeRule> = [
  { title: '角色', key: 'roleName', dataIndex: 'roleName', width: 120 },
  { title: '导出级别', key: 'exportLevel', width: 120 },
  { title: '说明', key: 'description', dataIndex: 'description', ellipsis: true },
]
</script>
