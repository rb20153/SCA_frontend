<template>
  <ListTable
    :columns="(columns as TableColumnsType<Record<string, unknown>>)"
    :data-source="(hits as unknown as Record<string, unknown>[])"
    :loading="loading"
    :pagination="pagination"
    :scroll-x="POLICY_RULE_HIT_TABLE_SCROLL_X"
    row-key="hitId"
  >
    <template #bodyCell="{ column, record: row, text }">
      <template v-if="column.key === 'occurredAt'">
        {{ formatPolicyRuleHitDateTime(getHit(row).occurredAt) }}
      </template>

      <template v-else-if="column.key === 'maskingAction'">
        <a-tag
          :color="POLICY_MASKING_ACTION_COLOR[getHit(row).maskingAction]"
          class="list-table-status-tag"
        >
          {{ POLICY_MASKING_ACTION_LABEL[getHit(row).maskingAction] }}
        </a-tag>
      </template>

      <template v-else-if="column.key === 'traceId'">
        <router-link
          :to="buildLogListTracePath(getHit(row).traceId)"
          class="list-table-link"
        >
          {{ getHit(row).traceId }}
        </router-link>
      </template>

      <template v-else-if="column.key === 'action'">
        <a href="#" class="list-table-link" @click.prevent="emit('detail', getHit(row))">
          详情
        </a>
      </template>

      <ListTableCell v-else :column="column" :text="text" />
    </template>
  </ListTable>
</template>

<script setup lang="ts">
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue'
import type { PolicyRuleHitListItem } from '@/types/policy'
import ListTable from '@/components/common/ListTable.vue'
import ListTableCell from '@/components/common/ListTableCell.vue'
import {
  POLICY_MASKING_ACTION_COLOR,
  POLICY_MASKING_ACTION_LABEL,
  POLICY_RULE_HIT_TABLE_SCROLL_X,
  buildLogListTracePath,
  formatPolicyRuleHitDateTime,
} from '@/utils/policyDisplay'

defineProps<{
  hits: PolicyRuleHitListItem[]
  loading?: boolean
  pagination: TablePaginationConfig
}>()

const emit = defineEmits<{
  detail: [hit: PolicyRuleHitListItem]
}>()

/** a-table bodyCell 的 record 收窄为 PolicyRuleHitListItem */
function getHit(row: unknown): PolicyRuleHitListItem {
  return row as PolicyRuleHitListItem
}

const columns: TableColumnsType<PolicyRuleHitListItem> = [
  { title: '时间', key: 'occurredAt', width: 170 },
  { title: '规则', key: 'ruleKeyword', dataIndex: 'ruleKeyword', width: 120, ellipsis: true },
  { title: '命中对象', key: 'hitObject', dataIndex: 'hitObject', width: 220, ellipsis: true },
  { title: '脱敏动作', key: 'maskingAction', width: 120 },
  { title: '责任人', key: 'responsibleUser', dataIndex: 'responsibleUser', width: 110, ellipsis: true },
  { title: 'TraceID', key: 'traceId', width: 180, ellipsis: true },
  { title: '操作', key: 'action', width: 80 },
]
</script>
