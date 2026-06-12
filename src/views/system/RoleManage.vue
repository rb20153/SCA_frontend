<template>
  <div class="page-container">
    <RoleCreateBar @create="openCreateDrawer" />

    <RoleQueryBar
      v-model="filterForm"
      @search="handleSearch"
      @reset="handleReset"
    />

    <a-card :bordered="false" class="table-card">
      <PageLoading :loading="loading && roleList.length === 0">
        <ListEmptyGuide
          v-if="!loading && roleList.length === 0"
          title="暂无角色"
          description="点击上方「新增角色」创建第一个角色"
        />
        <RoleTable
          v-else
          :roles="roleList"
          :loading="loading"
          :pagination="pagination"
          @edit="openEditDrawer"
          @delete="openDeleteModal"
        />
      </PageLoading>
    </a-card>

    <RoleFormDrawer
      v-model:open="drawerVisible"
      :mode="drawerMode"
      :role-id="editingRole?.roleId"
      :is-builtin="editingRole?.isBuiltin"
      :builtin-role-code="editingRole?.isBuiltin ? editingRole.roleCode : undefined"
      :initial-values="editingFormValues"
      @success="onFormSuccess"
    />

    <BoundCountDeleteModal
      v-if="deletingRole"
      v-model:open="deleteVisible"
      title="删除角色"
      :bound-count="deletingRole.boundUserCount"
      block-message="该角色下仍有用户绑定，请先解绑全部成员再操作。"
      confirm-message="删除后不可恢复，是否确认删除？"
      :delete-fn="() => deleteRole(deletingRole!.roleId)"
      @success="onDeleteSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { deleteRole, getRoleList } from '@/api/system'
import BoundCountDeleteModal from '@/components/common/BoundCountDeleteModal.vue'
import ListEmptyGuide from '@/components/common/ListEmptyGuide.vue'
import PageLoading from '@/components/common/PageLoading.vue'
import RoleCreateBar from '@/components/system/RoleCreateBar.vue'
import RoleFormDrawer from '@/components/system/RoleFormDrawer.vue'
import RoleQueryBar from '@/components/system/RoleQueryBar.vue'
import RoleTable from '@/components/system/RoleTable.vue'
import { useFilteredPaginatedList } from '@/composables/useFilteredPaginatedList'
import type { Role, RoleFormValues } from '@/types/system'
import { createEmptyRoleListFilters, roleListFiltersToQuery } from '@/utils/roleQuery'

const drawerVisible = ref(false)
const drawerMode = ref<'create' | 'edit'>('create')
const editingRole = ref<Role | null>(null)

const deleteVisible = ref(false)
const deletingRole = ref<Role | null>(null)

const {
  filterForm,
  loading,
  list: roleList,
  pagination,
  loadPage,
  handleSearch,
  handleReset,
} = useFilteredPaginatedList<Role, ReturnType<typeof createEmptyRoleListFilters>>(
  async (params) => (await getRoleList(params)).data,
  {
    createEmptyFilters: createEmptyRoleListFilters,
    filtersToQuery: roleListFiltersToQuery,
    pageSize: 10,
  },
)

/** 编辑抽屉初始值 */
const editingFormValues = computed<RoleFormValues | undefined>(() => {
  if (!editingRole.value) {
    return undefined
  }
  const role = editingRole.value
  return {
    roleName: role.roleName,
    roleCode: role.roleCode,
    status: role.status,
    remark: role.remark,
    permissions: { ...role.permissions },
  }
})

/** 打开新增角色抽屉 */
function openCreateDrawer() {
  drawerMode.value = 'create'
  editingRole.value = null
  drawerVisible.value = true
}

/** 打开编辑角色抽屉并填充当前行数据 */
function openEditDrawer(role: Role) {
  drawerMode.value = 'edit'
  editingRole.value = role
  drawerVisible.value = true
}

/** 新增/编辑成功后刷新列表 */
async function onFormSuccess() {
  editingRole.value = null
  await loadPage()
}

/** 打开删除确认（绑定数来自列表行数据） */
function openDeleteModal(role: Role) {
  deletingRole.value = role
  deleteVisible.value = true
}

/** 删除成功后从列表移除；若当前页删空且非第一页则回退一页 */
async function onDeleteSuccess() {
  const deletedId = deletingRole.value?.roleId
  deletingRole.value = null

  if (!deletedId) {
    await loadPage()
    return
  }

  roleList.value = roleList.value.filter((item) => item.roleId !== deletedId)
  if (typeof pagination.total === 'number' && pagination.total > 0) {
    pagination.total -= 1
  }

  if (roleList.value.length === 0 && (pagination.current ?? 1) > 1) {
    pagination.current = (pagination.current ?? 1) - 1
    await loadPage()
  }
}
</script>

<style scoped>
.page-container {
  min-height: 100%;
}
</style>
