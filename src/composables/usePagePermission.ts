import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import {
  canAccessPage,
  findFirstReadablePath,
  isWriteProtectedRoute,
  resolvePermissionOwner,
} from '@/utils/pagePermission'

/** 页面、组件和路由共享的 read/write 权限入口。 */
export function usePagePermission() {
  const authStore = useAuthStore()
  const permissions = computed(() => authStore.userInfo?.permission)

  function canRead(path: string): boolean {
    return canAccessPage(permissions.value, path, 'read')
  }

  function canWrite(path: string): boolean {
    return canAccessPage(permissions.value, path, 'write')
  }

  function canApprovePolicy(): boolean {
    const role = authStore.userInfo?.role
    return canRead('/policies') && (role === 'admin' || role === 'auditor')
  }

  return {
    permissionStatus: computed(() => authStore.permissionStatus),
    canRead,
    canWrite,
    canApprovePolicy,
    resolvePermissionOwner,
    isWriteProtectedRoute,
    firstReadablePath: computed(() => findFirstReadablePath(permissions.value)),
  }
}
