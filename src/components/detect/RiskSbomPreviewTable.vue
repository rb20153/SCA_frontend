<template>
  <ListTable
    :columns="columns"
    :data-source="rows"
    :loading="loading"
    :pagination="pagination"
    :scroll-x="OPEN_SOURCE_RISK_SBOM_PREVIEW_TABLE_SCROLL_X"
    row-key="rowId"
  >
    <template #bodyCell="{ column, record: row, text }">
      <template v-if="column.key === 'riskLevel'">
        <a-tag
          :color="RISK_COMPONENT_LEVEL_COLOR[getProjectRow(row).riskLevel]"
          class="list-table-status-tag"
        >
          {{ RISK_COMPONENT_LEVEL_LABEL[getProjectRow(row).riskLevel] }}
        </a-tag>
      </template>

      <template v-else-if="column.key === 'highRiskLicense'">
        <a-tag color="error" class="list-table-status-tag">
          {{ getModuleRow(row).highRiskLicense }}
        </a-tag>
      </template>

      <template v-else-if="column.key === 'confidence'">
        {{ formatSbomPackageConfidence(getPackageRow(row).confidence) }}
      </template>

      <template v-else-if="column.key === 'conflictHint'">
        <a-tag
          :color="SBOM_PACKAGE_CONFLICT_COLOR[getPackageRow(row).conflictHint]"
          class="list-table-status-tag"
        >
          {{ SBOM_PACKAGE_CONFLICT_LABEL[getPackageRow(row).conflictHint] }}
        </a-tag>
      </template>

      <template v-else-if="column.key === 'remediationSuggestion'">
        <ListTableCell :column="column" :text="getPackageRow(row).remediationSuggestion" />
      </template>

      <ListTableCell v-else :column="column" :text="text" />
    </template>
  </ListTable>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue'
import ListTable from '@/components/common/ListTable.vue'
import ListTableCell from '@/components/common/ListTableCell.vue'
import type {
  OpenSourceRiskSbomGranularity,
  OpenSourceRiskSbomModulePreviewRow,
  OpenSourceRiskSbomPackagePreviewRow,
  OpenSourceRiskSbomProjectPreviewRow,
} from '@/types/detect'
import {
  OPEN_SOURCE_RISK_SBOM_PREVIEW_TABLE_SCROLL_X,
  RISK_COMPONENT_LEVEL_COLOR,
  RISK_COMPONENT_LEVEL_LABEL,
  SBOM_PACKAGE_CONFLICT_COLOR,
  SBOM_PACKAGE_CONFLICT_LABEL,
  formatSbomPackageConfidence,
} from '@/utils/openSourceRiskSbomDisplay'

const props = defineProps<{
  granularity: OpenSourceRiskSbomGranularity
  rows: Array<
    | OpenSourceRiskSbomProjectPreviewRow
    | OpenSourceRiskSbomModulePreviewRow
    | OpenSourceRiskSbomPackagePreviewRow
  >
  loading?: boolean
  pagination: TablePaginationConfig
}>()

type SbomPreviewRow =
  | OpenSourceRiskSbomProjectPreviewRow
  | OpenSourceRiskSbomModulePreviewRow
  | OpenSourceRiskSbomPackagePreviewRow

/** 项目级预览列 */
const projectColumns: TableColumnsType<SbomPreviewRow> = [
  { title: '组件名', key: 'componentName', dataIndex: 'componentName', width: 120, ellipsis: true },
  { title: '版本', key: 'version', dataIndex: 'version', width: 90, ellipsis: true },
  { title: '许可证', key: 'license', dataIndex: 'license', width: 110, ellipsis: true },
  { title: '供应商', key: 'supplier', dataIndex: 'supplier', width: 130, ellipsis: true },
  { title: '引用方式', key: 'referenceMode', dataIndex: 'referenceMode', width: 120, ellipsis: true },
  { title: '风险', key: 'riskLevel', width: 90 },
]

/** 模块级预览列 */
const moduleColumns: TableColumnsType<SbomPreviewRow> = [
  { title: '模块', key: 'moduleName', dataIndex: 'moduleName', width: 160, ellipsis: true },
  { title: '组件数', key: 'componentCount', dataIndex: 'componentCount', width: 90 },
  { title: '高风险许可证', key: 'highRiskLicense', width: 130 },
  { title: '含漏洞组件', key: 'vulnerableComponentCount', dataIndex: 'vulnerableComponentCount', width: 110 },
]

/** 包级预览列 */
const packageColumns: TableColumnsType<SbomPreviewRow> = [
  { title: '包', key: 'packageLabel', dataIndex: 'packageLabel', width: 160, ellipsis: true },
  { title: '证据来源', key: 'evidenceSource', dataIndex: 'evidenceSource', width: 180, ellipsis: true },
  { title: '置信度', key: 'confidence', width: 90 },
  { title: '冲突提示', key: 'conflictHint', width: 120 },
  { title: '整改建议', key: 'remediationSuggestion', width: 180, ellipsis: true },
]

/** 按输出粒度切换表格列 */
const columns = computed(() => {
  if (props.granularity === 'module') {
    return moduleColumns
  }
  if (props.granularity === 'package') {
    return packageColumns
  }
  return projectColumns
})

/** 收窄为项目级行 */
function getProjectRow(row: unknown): OpenSourceRiskSbomProjectPreviewRow {
  return row as OpenSourceRiskSbomProjectPreviewRow
}

/** 收窄为模块级行 */
function getModuleRow(row: unknown): OpenSourceRiskSbomModulePreviewRow {
  return row as OpenSourceRiskSbomModulePreviewRow
}

/** 收窄为包级行 */
function getPackageRow(row: unknown): OpenSourceRiskSbomPackagePreviewRow {
  return row as OpenSourceRiskSbomPackagePreviewRow
}
</script>
