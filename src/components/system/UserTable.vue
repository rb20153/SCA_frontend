<template>
  <ListTable
    :columns="columns"
    :data-source="users"
    :loading="loading"
    :pagination="pagination"
    :scroll-x="USER_TABLE_SCROLL_X"
    row-key="userId"
  >
    <template #bodyCell="{ column, record: row, text }">
      <template v-if="column.key === 'status'">
        <a-tag
          :color="USER_STATUS_COLOR[getUser(row).status]"
          class="list-table-status-tag"
        >
          {{ USER_STATUS_LABEL[getUser(row).status] }}
        </a-tag>
      </template>

      <template v-else-if="column.key === 'lastLoginAt'">
        {{ formatLastLoginAt(getUser(row).lastLoginAt) }}
      </template>

      <template v-else-if="column.key === 'action'">
        <UserActionCell
          :user="getUser(row)"
          @edit="(item) => emit('edit', item)"
          @detail="(item) => emit('detail', item)"
          @delete="(item) => emit('delete', item)"
          @reset-password="(item) => emit('reset-password', item)"
        />
      </template>

      <ListTableCell v-else :column="column" :text="text" />
    </template>
  </ListTable>
</template>

<script setup lang="ts">
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue'
import type { SystemUser } from '@/types/user'
import ListTable from '@/components/common/ListTable.vue'
import ListTableCell from '@/components/common/ListTableCell.vue'
import UserActionCell from '@/components/system/UserActionCell.vue'
import {
  USER_STATUS_COLOR,
  USER_STATUS_LABEL,
  USER_TABLE_SCROLL_X,
  formatLastLoginAt,
} from '@/utils/userDisplay'

defineProps<{
  users: SystemUser[]
  loading?: boolean
  pagination: TablePaginationConfig
}>()

const emit = defineEmits<{
  edit: [user: SystemUser]
  detail: [user: SystemUser]
  delete: [user: SystemUser]
  'reset-password': [user: SystemUser]
}>()

/** a-table bodyCell 的 record 为 unknown，收窄为 SystemUser */
function getUser(row: unknown): SystemUser {
  return row as SystemUser
}

const columns: TableColumnsType<SystemUser> = [
  { title: '用户名', key: 'username', dataIndex: 'username', width: 120, ellipsis: true },
  { title: '姓名', key: 'realName', dataIndex: 'realName', width: 100, ellipsis: true },
  { title: '部门', key: 'departmentName', dataIndex: 'departmentName', width: 140, ellipsis: true },
  { title: '系统角色', key: 'roleName', dataIndex: 'roleName', width: 120, ellipsis: true },
  { title: '状态', key: 'status', width: 90 },
  { title: '最后登录', key: 'lastLoginAt', width: 180 },
  { title: '操作', key: 'action', width: 220 },
]
</script>
