<template>
  <div class="role-perm-list">
    <label
      v-for="item in ROLE_PERMISSION_OPTIONS"
      :key="item.key"
      class="perm-item"
    >
      <a-checkbox
        :checked="permissions[item.key]"
        :disabled="isItemDisabled(item.key)"
        @change="(event) => handleToggle(item.key, event.target.checked)"
      />
      <span class="perm-label">{{ item.label }}</span>
    </label>
  </div>
</template>

<script setup lang="ts">
import type { RolePermissionKey, RolePermissionMap } from '@/types/system'
import {
  ROLE_PERMISSION_OPTIONS,
  isBuiltinPermissionDisabled,
} from '@/utils/rolePermissions'

const props = defineProps<{
  /** 当前权限勾选表 */
  permissions: RolePermissionMap
  /** 编辑内置角色时传入编码，用于只读角色的禁用规则 */
  builtinRoleCode?: string
}>()

const emit = defineEmits<{
  'update:permissions': [value: RolePermissionMap]
}>()

/** 判断某项是否禁用（内置只读角色未勾选项不可再勾选） */
function isItemDisabled(key: RolePermissionKey): boolean {
  if (!props.builtinRoleCode) {
    return false
  }
  return isBuiltinPermissionDisabled(
    props.builtinRoleCode,
    key,
    props.permissions[key],
  )
}

/** 切换单项权限并向上同步 */
function handleToggle(key: RolePermissionKey, checked: boolean) {
  if (isItemDisabled(key)) {
    return
  }
  emit('update:permissions', {
    ...props.permissions,
    [key]: checked,
  })
}
</script>

<style scoped>
.role-perm-list {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  padding: 12px 16px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  background: #fafafa;
}

.perm-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  min-width: 0;
}

.perm-item:hover {
  background: #f5f9ff;
}

.perm-label {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.88);
  line-height: 1.4;
}
</style>
