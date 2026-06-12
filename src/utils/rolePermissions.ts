/**
 * 角色权限工具（桥接 mock 定义，供组件使用，避免组件直接 import mock）
 */
export {
  ALL_PERMISSION_KEYS,
  BUILTIN_ROLE_PERMISSIONS,
  PERMISSION_TREE_GROUPS,
  cloneRolePermissions,
  createDefaultCustomRolePermissions,
  createEmptyRolePermissions,
  isBuiltinPermissionDisabled,
} from '@/mock/modules/system/rolePermissionDefs'
