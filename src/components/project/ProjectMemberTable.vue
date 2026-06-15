<template>
  <ListTable
    :columns="columns"
    :data-source="members"
    :loading="loading"
    :pagination="pagination"
    :scroll-x="PROJECT_MEMBER_TABLE_SCROLL_X"
    row-key="memberId"
  >
    <template #bodyCell="{ column, record: row, text }">
      <template v-if="column.key === 'projectRole'">
        <a-tag
          :color="PROJECT_MEMBER_ROLE_COLOR[getMember(row).projectRole]"
          class="list-table-status-tag"
        >
          {{ PROJECT_MEMBER_ROLE_LABEL[getMember(row).projectRole] }}
        </a-tag>
      </template>

      <template v-else-if="column.key === 'joinedAt'">
        {{ formatProjectMemberJoinedAt(getMember(row).joinedAt) }}
      </template>

      <template v-else-if="column.key === 'action'">
        <ProjectMemberActionCell
          v-if="getMember(row).projectRole === 'member'"
          :member="getMember(row)"
          @transfer-owner="(member) => emit('transfer-owner', member)"
          @remove="(member) => emit('remove', member)"
        />
        <span v-else class="list-table-action-dash">—</span>
      </template>

      <ListTableCell v-else :column="column" :text="text" />
    </template>
  </ListTable>
</template>

<script setup lang="ts">
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue'
import type { ProjectMember } from '@/types/project'
import ListTable from '@/components/common/ListTable.vue'
import ListTableCell from '@/components/common/ListTableCell.vue'
import ProjectMemberActionCell from '@/components/project/ProjectMemberActionCell.vue'
import {
  PROJECT_MEMBER_ROLE_COLOR,
  PROJECT_MEMBER_ROLE_LABEL,
  PROJECT_MEMBER_TABLE_SCROLL_X,
  formatProjectMemberJoinedAt,
} from '@/utils/projectMemberDisplay'

defineProps<{
  members: ProjectMember[]
  loading?: boolean
  pagination: TablePaginationConfig
}>()

const emit = defineEmits<{
  'transfer-owner': [member: ProjectMember]
  remove: [member: ProjectMember]
}>()

/** a-table bodyCell 的 record 为 unknown，收窄为 ProjectMember */
function getMember(row: unknown): ProjectMember {
  return row as ProjectMember
}

const columns: TableColumnsType<ProjectMember> = [
  { title: '姓名', key: 'realName', dataIndex: 'realName', width: 100, ellipsis: true },
  { title: '用户名', key: 'username', dataIndex: 'username', width: 120, ellipsis: true },
  { title: '部门', key: 'departmentName', dataIndex: 'departmentName', width: 140, ellipsis: true },
  { title: '系统角色', key: 'roleName', dataIndex: 'roleName', width: 120, ellipsis: true },
  { title: '项目内角色', key: 'projectRole', width: 110 },
  { title: '加入时间', key: 'joinedAt', width: 170 },
  { title: '操作', key: 'action', width: 160 },
]
</script>
