<template>
  <a-table
    class="role-page-permission-table"
    :columns="columns"
    :data-source="ROLE_PERMISSION_OPTIONS"
    :pagination="false"
    row-key="key"
    size="small"
  >
    <template #bodyCell="{ column, record }">
      <template v-if="column.key === 'page'">
        <div class="page-cell">
          <span class="page-name">{{ getOption(record).label }}</span>
        </div>
      </template>
      <a-checkbox
        v-else-if="column.key === 'read'"
        :checked="permissions[getOption(record).key].read"
        @change="(event) => handleReadToggle(getOption(record).key, event.target.checked)"
      >
        可读
      </a-checkbox>
      <a-checkbox
        v-else-if="column.key === 'write'"
        :checked="permissions[getOption(record).key].write"
        @change="(event) => handleWriteToggle(getOption(record).key, event.target.checked)"
      >
        可编辑
      </a-checkbox>
    </template>
  </a-table>
</template>

<script setup lang="ts">
import type { TableColumnsType } from 'ant-design-vue'
import type { RolePermissionKey, RolePermissionMap } from '@/types/system'
import { ROLE_PERMISSION_OPTIONS, type RolePermissionOption } from '@/constants/rolePermissionDefs'

const props = defineProps<{
  /** 当前权限勾选表 */
  permissions: RolePermissionMap
}>()

const emit = defineEmits<{
  'update:permissions': [value: RolePermissionMap]
}>()

const columns: TableColumnsType<RolePermissionOption> = [
  { title: '页面', key: 'page', width: 390 },
  { title: '可读', key: 'read', width: 120, align: 'center' },
  { title: '可编辑', key: 'write', width: 130, align: 'center' },
]

function getOption(record: unknown): RolePermissionOption {
  return record as RolePermissionOption
}

/** 取消可读时同时收回可编辑，保证 write 不会脱离 read。 */
function handleReadToggle(key: RolePermissionKey, checked: boolean) {
  emit('update:permissions', {
    ...props.permissions,
    [key]: {
      read: checked,
      write: checked ? props.permissions[key].write : false,
    },
  })
}

/** 授予可编辑时自动授予可读。 */
function handleWriteToggle(key: RolePermissionKey, checked: boolean) {
  emit('update:permissions', {
    ...props.permissions,
    [key]: { read: checked || props.permissions[key].read, write: checked },
  })
}
</script>

<style scoped>
.role-page-permission-table {
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  overflow: hidden;
}

.page-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.page-name {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.88);
  line-height: 1.4;
}

</style>
