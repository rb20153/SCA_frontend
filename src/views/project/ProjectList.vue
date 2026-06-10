<template>
  <div class="page-container">
    <ProjectCreateBar @create="openCreateModal" />

    <ProjectQueryBar
      v-model="filterForm"
      @search="handleSearch"
      @reset="handleReset"
    />

    <a-card :bordered="false" class="table-card">
      <PageLoading :loading="loading && projectList.length === 0">
        <ListEmptyGuide
          v-if="!loading && projectList.length === 0"
          title="暂无项目"
          description="点击上方「新增项目」创建第一个项目"
        />
        <ProjectTable
          v-else
          :projects="projectList"
          :loading="loading"
          :pagination="pagination"
          @edit="openEditModal"
          @delete="openDeleteModal"
        />
      </PageLoading>
    </a-card>

    <ProjectFormModal
      v-model:open="formVisible"
      :mode="formMode"
      :project-id="editingProject?.projectId"
      :initial-values="editingFormValues"
      @success="onFormSuccess"
    />

    <ProjectDeleteModal
      v-if="deletingProject"
      v-model:open="deleteVisible"
      :project-id="deletingProject.projectId"
      :project-name="deletingProject.projectName"
      @success="onDeleteSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { getProjectList } from '@/api/project'
import ListEmptyGuide from '@/components/common/ListEmptyGuide.vue'
import PageLoading from '@/components/common/PageLoading.vue'
import ProjectCreateBar from '@/components/project/ProjectCreateBar.vue'
import ProjectDeleteModal from '@/components/project/ProjectDeleteModal.vue'
import ProjectFormModal from '@/components/project/ProjectFormModal.vue'
import ProjectQueryBar from '@/components/project/ProjectQueryBar.vue'
import ProjectTable from '@/components/project/ProjectTable.vue'
import { useFilteredPaginatedList } from '@/composables/useFilteredPaginatedList'
import type { Project, ProjectFormValues } from '@/types/project'
import {
  createEmptyProjectListFilters,
  projectListFiltersToQuery,
} from '@/utils/projectQuery'

const formVisible = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const editingProject = ref<Project | null>(null)
const deleteVisible = ref(false)
const deletingProject = ref<Project | null>(null)

const {
  filterForm,
  loading,
  list: projectList,
  pagination,
  loadPage,
  handleSearch,
  handleReset,
} = useFilteredPaginatedList<Project, ReturnType<typeof createEmptyProjectListFilters>>(
  async (params) => (await getProjectList(params)).data,
  {
    createEmptyFilters: createEmptyProjectListFilters,
    filtersToQuery: projectListFiltersToQuery,
    pageSize: 10,
  },
)

/** 编辑弹窗表单初始值 */
const editingFormValues = computed<ProjectFormValues | undefined>(() => {
  if (!editingProject.value) return undefined
  return {
    projectName: editingProject.value.projectName,
    description: editingProject.value.description,
    owner: editingProject.value.owner,
    department: editingProject.value.department,
  }
})

/** 打开新增项目弹窗 */
function openCreateModal() {
  formMode.value = 'create'
  editingProject.value = null
  formVisible.value = true
}

/** 打开编辑项目弹窗并回填当前行数据 */
function openEditModal(project: Project) {
  formMode.value = 'edit'
  editingProject.value = project
  formVisible.value = true
}

/** 打开删除确认弹窗 */
function openDeleteModal(project: Project) {
  deletingProject.value = project
  deleteVisible.value = true
}

/** 新增/编辑成功后刷新当前页列表 */
async function onFormSuccess() {
  await loadPage()
}

/** 删除成功后从列表移除；若当前页删空且非第一页则回退一页 */
async function onDeleteSuccess() {
  const deletedId = deletingProject.value?.projectId
  deletingProject.value = null

  if (!deletedId) {
    await loadPage()
    return
  }

  projectList.value = projectList.value.filter((item) => item.projectId !== deletedId)
  if (typeof pagination.total === 'number' && pagination.total > 0) {
    pagination.total -= 1
  }

  if (projectList.value.length === 0 && (pagination.current ?? 1) > 1) {
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
