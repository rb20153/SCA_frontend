<template>
  <ListTable
    :columns="columns"
    :data-source="departments"
    :loading="loading"
    :pagination="pagination"
    :scroll-x="DEPARTMENT_TABLE_SCROLL_X"
    row-key="departmentId"
  >
    <template #bodyCell="{ column, record: row, text }">
      <template v-if="column.key === 'status'">
        <a-tag
          :color="DEPARTMENT_STATUS_COLOR[getDepartment(row).status]"
          class="list-table-status-tag"
        >
          {{ DEPARTMENT_STATUS_LABEL[getDepartment(row).status] }}
        </a-tag>
      </template>

      <template v-else-if="column.key === 'memberCount'">
        <a
          v-if="getDepartment(row).memberCount > 0"
          class="list-table-link"
          @click.prevent="goUsersByDepartment(getDepartment(row))"
        >
          {{ getDepartment(row).memberCount }}
        </a>
        <span v-else>{{ getDepartment(row).memberCount }}</span>
      </template>

      <template v-else-if="column.key === 'createdAt'">
        {{ formatDepartmentDateTime(getDepartment(row).createdAt) }}
      </template>

      <template v-else-if="column.key === 'action'">
        <DepartmentActionCell
          :department="getDepartment(row)"
          @edit="(dept) => emit('edit', dept)"
          @delete="(dept) => emit('delete', dept)"
        />
      </template>

      <ListTableCell v-else :column="column" :text="text" />
    </template>
  </ListTable>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue'
import type { Department } from '@/types/system'
import ListTable from '@/components/common/ListTable.vue'
import ListTableCell from '@/components/common/ListTableCell.vue'
import DepartmentActionCell from '@/components/system/DepartmentActionCell.vue'
import {
  DEPARTMENT_STATUS_COLOR,
  DEPARTMENT_STATUS_LABEL,
  DEPARTMENT_TABLE_SCROLL_X,
  formatDepartmentDateTime,
} from '@/utils/departmentDisplay'

defineProps<{
  departments: Department[]
  loading?: boolean
  pagination: TablePaginationConfig
}>()

const emit = defineEmits<{
  edit: [department: Department]
  delete: [department: Department]
}>()

const router = useRouter()

/** a-table bodyCell 的 record 为 unknown，收窄为 Department */
function getDepartment(row: unknown): Department {
  return row as Department
}

/** 成员人数 > 0 时跳转用户列表并按部门名称筛选 */
function goUsersByDepartment(department: Department) {
  router.push({
    path: '/system/users',
    query: { departmentName: department.departmentName },
  })
}

const columns: TableColumnsType<Department> = [
  { title: '部门名称', key: 'departmentName', dataIndex: 'departmentName', width: 160, ellipsis: true },
  { title: '状态', key: 'status', width: 100 },
  { title: '备注', key: 'remark', dataIndex: 'remark', width: 200, ellipsis: true },
  { title: '成员人数', key: 'memberCount', dataIndex: 'memberCount', width: 96, align: 'center' },
  { title: '创建时间', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 120 },
]
</script>
