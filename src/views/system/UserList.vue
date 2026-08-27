<template>
  <div class="page-container">
    <UserCreateBar @create="openCreateModal" />

    <UserQueryBar
      v-model="filterForm"
      @search="handleSearch"
      @reset="handleReset"
    />

    <a-card :bordered="false" class="table-card">
      <PageLoading :loading="loading && userList.length === 0">
        <ListEmptyGuide
          v-if="!loading && userList.length === 0"
          title="暂无用户"
          description="点击上方「新增用户」创建第一个用户"
        />
        <UserTable
          v-else
          :users="userList"
          :loading="loading"
          :pagination="pagination"
          @edit="openEditModal"
          @detail="openDetailDrawer"
          @delete="openDeleteModal"
          @reset-password="openResetPasswordModal"
        />
      </PageLoading>
    </a-card>

    <UserFormModal
      v-model:open="formVisible"
      :mode="formMode"
      :user-id="editingUser?.userId"
      :initial-values="editingFormValues"
      @success="onFormSuccess"
    />

    <UserDetailDrawer
      v-model:open="detailVisible"
      :user-id="detailUserId"
    />

    <BoundCountDeleteModal
      v-if="deletingUser"
      v-model:open="deleteVisible"
      title="删除用户"
      :bound-count="deletingUser.ownedProjectCount"
      block-message="该用户仍负责项目，请先移交负责项目给其他用户再进行操作。"
      confirm-message="删除后不可恢复，是否确认删除？"
      :delete-fn="async () => { await deleteUser(deletingUser!.userId) }"
      @success="onDeleteSuccess"
    />

    <UserResetPasswordModal
      v-if="resettingUser"
      v-model:open="resetPasswordVisible"
      :user="resettingUser"
      @success="onResetPasswordSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { deleteUser, getRoleFilterOptions, getUserList } from '@/api/user'
import BoundCountDeleteModal from '@/components/common/BoundCountDeleteModal.vue'
import ListEmptyGuide from '@/components/common/ListEmptyGuide.vue'
import PageLoading from '@/components/common/PageLoading.vue'
import UserCreateBar from '@/components/system/UserCreateBar.vue'
import UserDetailDrawer from '@/components/system/UserDetailDrawer.vue'
import UserFormModal from '@/components/system/UserFormModal.vue'
import UserQueryBar from '@/components/system/UserQueryBar.vue'
import UserResetPasswordModal from '@/components/system/UserResetPasswordModal.vue'
import UserTable from '@/components/system/UserTable.vue'
import { useFilteredPaginatedList } from '@/composables/useFilteredPaginatedList'
import type { SystemUser, UserFormValues } from '@/types/user'
import { createEmptyUserListFilters, userListFiltersToQuery } from '@/utils/userQuery'

const route = useRoute()

const formVisible = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const editingUser = ref<SystemUser | null>(null)

const detailVisible = ref(false)
const detailUserId = ref<string | null>(null)

const deleteVisible = ref(false)
const deletingUser = ref<SystemUser | null>(null)

const resetPasswordVisible = ref(false)
const resettingUser = ref<SystemUser | null>(null)

const {
  filterForm,
  loading,
  list: userList,
  pagination,
  loadPage,
  handleSearch,
  handleReset,
} = useFilteredPaginatedList<SystemUser, ReturnType<typeof createEmptyUserListFilters>>(
  async (params) => (await getUserList(params)).data,
  {
    createEmptyFilters: createEmptyUserListFilters,
    filtersToQuery: userListFiltersToQuery,
    pageSize: 10,
    immediate: false,
  },
)

/** 从部门/角色管理跳转时，按 query 预填筛选并查询 */
async function applyRouteFilters() {
  filterForm.value.realName = ''
  filterForm.value.createdAtRange = undefined

  const departmentName = route.query.departmentName
  if (typeof departmentName === 'string' && departmentName) {
    filterForm.value.departmentName = departmentName
    filterForm.value.roleId = ''
  } else {
    filterForm.value.departmentName = ''
  }

  const roleName = route.query.roleName
  if (typeof roleName === 'string' && roleName) {
    const res = await getRoleFilterOptions()
    const matchedRole = res.data.find((item) => item.roleName === roleName)
    if (matchedRole) {
      filterForm.value.roleId = matchedRole.roleId
      filterForm.value.departmentName = ''
    }
  } else if (typeof departmentName !== 'string' || !departmentName) {
    filterForm.value.roleId = ''
  }
}

/** 路由 query 变化时重新套用筛选（同页复用时 onMounted 不会再次触发） */
watch(
  () => route.query,
  async () => {
    await applyRouteFilters()
    await handleSearch()
  },
  { immediate: true },
)

/** 编辑弹窗初始值 */
const editingFormValues = computed<UserFormValues | undefined>(() => {
  if (!editingUser.value) {
    return undefined
  }
  const user = editingUser.value
  return {
    username: user.username,
    realName: user.realName,
    password: '',
    departmentId: user.departmentId,
    roleId: user.roleId,
    phone: user.phone,
    status: user.status,
  }
})

/** 打开新增用户弹窗 */
function openCreateModal() {
  formMode.value = 'create'
  editingUser.value = null
  formVisible.value = true
}

/** 打开编辑用户弹窗并填充当前行数据 */
function openEditModal(user: SystemUser) {
  formMode.value = 'edit'
  editingUser.value = user
  formVisible.value = true
}

/** 打开用户详情抽屉 */
function openDetailDrawer(user: SystemUser) {
  detailUserId.value = user.userId
  detailVisible.value = true
}

/** 打开删除确认（负责项目数来自列表行数据） */
function openDeleteModal(user: SystemUser) {
  deletingUser.value = user
  deleteVisible.value = true
}

/** 打开重置密码弹窗 */
function openResetPasswordModal(user: SystemUser) {
  resettingUser.value = user
  resetPasswordVisible.value = true
}

/** 新增/编辑成功后刷新列表 */
async function onFormSuccess() {
  editingUser.value = null
  await loadPage()
}

/** 重置密码成功（列表无需变更） */
function onResetPasswordSuccess() {
  resettingUser.value = null
}

/** 删除成功后从列表移除；若当前页删空且非第一页则回退一页 */
async function onDeleteSuccess() {
  const deletedId = deletingUser.value?.userId
  deletingUser.value = null

  if (!deletedId) {
    await loadPage()
    return
  }

  userList.value = userList.value.filter((item) => item.userId !== deletedId)
  if (typeof pagination.total === 'number' && pagination.total > 0) {
    pagination.total -= 1
  }

  if (userList.value.length === 0 && (pagination.current ?? 1) > 1) {
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

