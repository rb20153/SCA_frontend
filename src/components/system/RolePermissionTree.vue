<template>
  <div class="role-perm-tree">
    <a-collapse v-model:active-key="activeKeys" :bordered="false">
      <a-collapse-panel
        v-for="group in PERMISSION_TREE_GROUPS"
        :key="group.key"
        :header="group.title"
      >
        <div class="perm-grid">
          <label
            v-for="item in group.children"
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
      </a-collapse-panel>
    </a-collapse>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { RolePermissionKey, RolePermissionMap } from '@/types/system'
import {
  PERMISSION_TREE_GROUPS,
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

const activeKeys = ref<string[]>(['menu', 'op'])

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
.role-perm-tree {
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
}

.perm-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 16px;
}

.perm-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  min-width: 0;
}

.perm-item:hover {
  background: #fafafa;
}

.perm-label {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.88);
  line-height: 1.4;
}
</style>
