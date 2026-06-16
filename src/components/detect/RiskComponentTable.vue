<template>
  <ListTable
    :columns="columns"
    :data-source="components"
    :loading="loading"
    :pagination="pagination"
    :scroll-x="RISK_COMPONENT_TABLE_SCROLL_X"
    row-key="componentId"
    :row-class-name="resolveRowClassName"
  >
    <template #bodyCell="{ column, record: row, text }">
      <template v-if="column.key === 'componentName'">
        <span :class="{ 'cell-ignored': getComponent(row).ignored }">
          {{ getComponent(row).componentName }}
          <span v-if="getComponent(row).ignored" class="ignored-suffix">（已忽略）</span>
        </span>
      </template>

      <template v-else-if="column.key === 'version'">
        <span :class="{ 'cell-ignored': getComponent(row).ignored }">
          {{ getComponent(row).version }}
        </span>
      </template>

      <template v-else-if="column.key === 'license'">
        <span :class="{ 'cell-ignored': getComponent(row).ignored }">
          {{ getComponent(row).license }}
        </span>
      </template>

      <template v-else-if="column.key === 'identifyBasis'">
        <a-tag
          :color="RISK_COMPONENT_IDENTIFY_BASIS_COLOR[getComponent(row).identifyBasis]"
          class="list-table-status-tag"
        >
          {{ getComponent(row).identifyBasisLabel }}
        </a-tag>
      </template>

      <template v-else-if="column.key === 'sourceMode'">
        {{ TASK_SOURCE_MODE_LABEL[getComponent(row).sourceMode] }}
      </template>

      <template v-else-if="column.key === 'riskLevel'">
        <a-tag
          :color="RISK_COMPONENT_LEVEL_COLOR[getComponent(row).riskLevel]"
          class="list-table-status-tag"
        >
          {{ RISK_COMPONENT_LEVEL_LABEL[getComponent(row).riskLevel] }}
        </a-tag>
      </template>

      <template v-else-if="column.key === 'action'">
        <span class="action-cell">
          <a href="#" class="list-table-link" @click.prevent="emit('detail', getComponent(row))">详情</a>
          <a
            v-if="getComponent(row).ignored"
            href="#"
            class="list-table-link"
            @click.prevent="emit('revoke-ignore', getComponent(row))"
          >
            撤销忽略
          </a>
          <a
            v-else
            href="#"
            class="list-table-link list-table-link--danger"
            @click.prevent="emit('ignore', getComponent(row))"
          >
            忽略
          </a>
        </span>
      </template>

      <ListTableCell v-else :column="column" :text="text" />
    </template>
  </ListTable>
</template>

<script setup lang="ts">
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue'
import ListTable from '@/components/common/ListTable.vue'
import ListTableCell from '@/components/common/ListTableCell.vue'
import type { OpenSourceRiskComponent } from '@/types/detect'
import { TASK_SOURCE_MODE_LABEL } from '@/utils/taskDisplay'
import {
  RISK_COMPONENT_IDENTIFY_BASIS_COLOR,
  RISK_COMPONENT_LEVEL_COLOR,
  RISK_COMPONENT_LEVEL_LABEL,
  RISK_COMPONENT_TABLE_SCROLL_X,
} from '@/utils/openSourceRiskComponentQuery'

defineProps<{
  components: OpenSourceRiskComponent[]
  loading?: boolean
  pagination: TablePaginationConfig
}>()

const emit = defineEmits<{
  detail: [component: OpenSourceRiskComponent]
  ignore: [component: OpenSourceRiskComponent]
  'revoke-ignore': [component: OpenSourceRiskComponent]
}>()

/** a-table bodyCell 的 record 收窄为 OpenSourceRiskComponent */
function getComponent(row: unknown): OpenSourceRiskComponent {
  return row as OpenSourceRiskComponent
}

/** 已忽略行整行灰色 */
function resolveRowClassName(record: OpenSourceRiskComponent): string {
  return record.ignored ? 'row-ignored' : ''
}

const columns: TableColumnsType<OpenSourceRiskComponent> = [
  {
    title: '组件名',
    key: 'componentName',
    dataIndex: 'componentName',
    width: 200,
    ellipsis: true,
  },
  { title: '版本', key: 'version', dataIndex: 'version', width: 100, ellipsis: true },
  { title: '许可证', key: 'license', dataIndex: 'license', width: 120, ellipsis: true },
  { title: '识别依据', key: 'identifyBasis', width: 140 },
  { title: '来源', key: 'sourceMode', width: 120 },
  { title: '风险等级', key: 'riskLevel', width: 100 },
  { title: '操作', key: 'action', width: 140 },
]
</script>

<style scoped>
.action-cell {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  white-space: nowrap;
}

.ignored-suffix {
  margin-left: 2px;
}

:deep(.row-ignored) {
  color: rgba(0, 0, 0, 0.45);
}

:deep(.row-ignored .ant-tag) {
  opacity: 0.65;
}

:deep(.row-ignored .ellipsis-text),
:deep(.row-ignored .list-table-plain-cell) {
  color: rgba(0, 0, 0, 0.45);
}

.cell-ignored {
  color: rgba(0, 0, 0, 0.45);
}
</style>
