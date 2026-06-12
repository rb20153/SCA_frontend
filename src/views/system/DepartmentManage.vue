<template>
  <div class="page-container">
    <DepartmentCreateBar @create="openCreateModal" />

    <DepartmentQueryBar
      v-model="filterForm"
      @search="handleSearch"
      @reset="handleReset"
    />

    <a-card :bordered="false" class="table-card">
      <PageLoading :loading="loading && departmentList.length === 0">
        <ListEmptyGuide
          v-if="!loading && departmentList.length === 0"
          title="暂无部门"
          description="点击上方「新增部门」创建第一个部门"
        />
        <DepartmentTable
          v-else
          :departments="departmentList"
          :loading="loading"
          :pagination="pagination"
          @edit="openEditModal"
          @delete="openDeleteModal"
        />
      </PageLoading>
    </a-card>

    <DepartmentFormModal
      v-model:open="formVisible"
      :mode="formMode"
      :department-id="editingDepartment?.departmentId"
      :initial-values="editingFormValues"
      @success="onFormSuccess"
    />

    <BoundCountDeleteModal
      v-if="deletingDepartment"
      v-model:open="deleteVisible"
      title="删除部门"
      :bound-count="deletingDepartment.memberCount"
      block-message="该部门下有成员绑定，请移除全部成员再操作。"
      confirm-message="一旦删除不可恢复，是否确认删除？"
      :delete-fn="() => deleteDepartment(deletingDepartment!.departmentId)"
      @success="onDeleteSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { deleteDepartment, getDepartmentList } from '@/api/system'
import BoundCountDeleteModal from '@/components/common/BoundCountDeleteModal.vue'
import ListEmptyGuide from '@/components/common/ListEmptyGuide.vue'
import PageLoading from '@/components/common/PageLoading.vue'
import DepartmentCreateBar from '@/components/system/DepartmentCreateBar.vue'
import DepartmentFormModal from '@/components/system/DepartmentFormModal.vue'
import DepartmentQueryBar from '@/components/system/DepartmentQueryBar.vue'
import DepartmentTable from '@/components/system/DepartmentTable.vue'
import { useFilteredPaginatedList } from '@/composables/useFilteredPaginatedList'
import type { Department, DepartmentFormValues } from '@/types/system'
import {
  createEmptyDepartmentListFilters,
  departmentListFiltersToQuery,
} from '@/utils/departmentQuery'

const formVisible = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const editingDepartment = ref<Department | null>(null)

const deleteVisible = ref(false)
const deletingDepartment = ref<Department | null>(null)

const {
  filterForm,
  loading,
  list: departmentList,
  pagination,
  loadPage,
  handleSearch,
  handleReset,
} = useFilteredPaginatedList<Department, ReturnType<typeof createEmptyDepartmentListFilters>>(
  async (params) => (await getDepartmentList(params)).data,
  {
    createEmptyFilters: createEmptyDepartmentListFilters,
    filtersToQuery: departmentListFiltersToQuery,
    pageSize: 10,
  },
)

/** 编辑弹窗初始值 */
const editingFormValues = computed<DepartmentFormValues | undefined>(() => {
  if (!editingDepartment.value) {
    return undefined
  }
  const dept = editingDepartment.value
  return {
    departmentName: dept.departmentName,
    status: dept.status,
    remark: dept.remark,
  }
})

/** 打开新增部门弹窗 */
function openCreateModal() {
  formMode.value = 'create'
  editingDepartment.value = null
  formVisible.value = true
}

/** 打开编辑部门弹窗并填充当前行数据 */
function openEditModal(department: Department) {
  formMode.value = 'edit'
  editingDepartment.value = department
  formVisible.value = true
}

/** 新增/编辑成功后刷新列表 */
async function onFormSuccess() {
  editingDepartment.value = null
  await loadPage()
}

/** 打开删除确认（绑定数来自列表行数据） */
function openDeleteModal(department: Department) {
  deletingDepartment.value = department
  deleteVisible.value = true
}

/** 删除成功后从列表移除；若当前页删空且非第一页则回退一页 */
async function onDeleteSuccess() {
  const deletedId = deletingDepartment.value?.departmentId
  deletingDepartment.value = null

  if (!deletedId) {
    await loadPage()
    return
  }

  departmentList.value = departmentList.value.filter((item) => item.departmentId !== deletedId)
  if (typeof pagination.total === 'number' && pagination.total > 0) {
    pagination.total -= 1
  }

  if (departmentList.value.length === 0 && (pagination.current ?? 1) > 1) {
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
