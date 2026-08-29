/**
 * 角色权限工具（桥接 mock 定义，供组件使用，避免组件直接 import mock）
 */
export {
  ALL_PERMISSION_KEYS,
  PERMISSION_TREE_GROUPS,
  ROLE_PERMISSION_OPTIONS,
  cloneRolePermissions,
  createDefaultCustomRolePermissions,
  createEmptyRolePermissions,
} from '@/constants/rolePermissionDefs'
