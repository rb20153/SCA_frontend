<template>
  <ListTable
    :columns="columns"
    :data-source="policies"
    :loading="loading"
    :pagination="pagination"
    :scroll-x="POLICY_TABLE_SCROLL_X"
    row-key="policyId"
  >
    <template #bodyCell="{ column, record: row }">
      <template v-if="column.key === 'isDefault'">
        <a-tag :color="getPolicy(row).isDefault ? 'blue' : 'default'" class="list-table-status-tag">
          {{ getPolicy(row).isDefault ? '是' : '否' }}
        </a-tag>
      </template>

      <template v-else-if="column.key === 'updatedAt'">
        {{ formatPolicyDateTime(getPolicy(row).updatedAt) }}
      </template>

      <template v-else-if="column.key === 'action'">
        <PolicyActionCell
          :policy="getPolicy(row)"
          @delete="(policy) => emit('delete', policy)"
        />
      </template>
    </template>
  </ListTable>
</template>

<script setup lang="ts">
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue'
import type { Policy } from '@/types/policy'
import ListTable from '@/components/common/ListTable.vue'
import PolicyActionCell from '@/components/policy/PolicyActionCell.vue'
import { POLICY_TABLE_SCROLL_X, formatPolicyDateTime } from '@/utils/policyDisplay'

defineProps<{
  policies: Policy[]
  loading?: boolean
  pagination: TablePaginationConfig
}>()

const emit = defineEmits<{
  delete: [policy: Policy]
}>()

/** a-table bodyCell 的 record 为 unknown，收窄为 Policy */
function getPolicy(row: unknown): Policy {
  return row as Policy
}

const columns: TableColumnsType<Policy> = [
  { title: '策略名称', key: 'policyName', dataIndex: 'policyName', width: 180, ellipsis: true },
  { title: '适用场景描述', key: 'scenarioDescription', dataIndex: 'scenarioDescription', width: 200, ellipsis: true },
  { title: '引用项目数', key: 'referencedProjectCount', dataIndex: 'referencedProjectCount', width: 110 },
  { title: '是否默认', key: 'isDefault', width: 100 },
  { title: '更新时间', key: 'updatedAt', width: 160 },
  { title: '操作', key: 'action', width: 280 },
]
</script>
