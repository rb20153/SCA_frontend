<template>
  <ListTable
    :columns="columns"
    :data-source="roles"
    :loading="loading"
    :pagination="pagination"
    :scroll-x="ROLE_TABLE_SCROLL_X"
    row-key="roleId"
  >
    <template #bodyCell="{ column, record: row, text }">
      <template v-if="column.key === 'status'">
        <a-tag
          :color="ROLE_STATUS_COLOR[getRole(row).status]"
          class="list-table-status-tag"
        >
          {{ ROLE_STATUS_LABEL[getRole(row).status] }}
        </a-tag>
      </template>

      <template v-else-if="column.key === 'boundUserCount'">
        <a
          v-if="getRole(row).boundUserCount > 0"
          class="list-table-link"
          @click.prevent="goUsersByRole(getRole(row))"
        >
          {{ getRole(row).boundUserCount }}
        </a>
        <span v-else>{{ getRole(row).boundUserCount }}</span>
      </template>

      <template v-else-if="column.key === 'createdAt'">
        {{ formatRoleDateTime(getRole(row).createdAt) }}
      </template>

      <template v-else-if="column.key === 'action'">
        <RoleActionCell
          :role="getRole(row)"
          @edit="(item) => emit('edit', item)"
          @delete="(item) => emit('delete', item)"
        />
      </template>

      <ListTableCell v-else :column="column" :text="text" />
    </template>
  </ListTable>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useRouteWithFrom } from '@/composables/useRouteWithFrom'
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue'
import type { Role } from '@/types/system'
import ListTable from '@/components/common/ListTable.vue'
import ListTableCell from '@/components/common/ListTableCell.vue'
import RoleActionCell from '@/components/system/RoleActionCell.vue'
import {
  ROLE_STATUS_COLOR,
  ROLE_STATUS_LABEL,
  ROLE_TABLE_SCROLL_X,
  formatRoleDateTime,
} from '@/utils/roleDisplay'

defineProps<{
  roles: Role[]
  loading?: boolean
  pagination: TablePaginationConfig
}>()

const emit = defineEmits<{
  edit: [role: Role]
  delete: [role: Role]
}>()

const router = useRouter()
const { withFrom } = useRouteWithFrom()

/** a-table bodyCell 的 record 为 unknown，收窄为 Role */
function getRole(row: unknown): Role {
  return row as Role
}

/** 绑定用户数 > 0 时跳转用户列表并按角色名称筛选 */
function goUsersByRole(role: Role) {
  router.push(
    withFrom({
      path: '/system/users',
      query: { roleName: role.roleName },
    }),
  )
}

const columns: TableColumnsType<Role> = [
  { title: '角色名称', key: 'roleName', dataIndex: 'roleName', width: 140, ellipsis: true },
  { title: '角色编码', key: 'roleCode', dataIndex: 'roleCode', width: 130, ellipsis: true },
  { title: '状态', key: 'status', width: 100 },
  { title: '备注', key: 'remark', dataIndex: 'remark', width: 200, ellipsis: true },
  { title: '绑定用户数', key: 'boundUserCount', dataIndex: 'boundUserCount', width: 110, align: 'center' },
  { title: '创建时间', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 140 },
]
</script>
