<template>
  <div class="page-container">
    <KbProjectQueryBar
      v-model="filterForm"
      @search="handleSearch"
      @reset="handleReset"
    />

    <a-card :bordered="false" class="table-card">
      <PageLoading :loading="loading && kbProjectList.length === 0">
        <ListEmptyGuide
          v-if="!loading && kbProjectList.length === 0"
          title="暂无开源项目"
          description="知识库中还没有开源项目数据"
        />
        <KbProjectTable
          v-else
          :projects="kbProjectList"
          :loading="loading"
          :pagination="pagination"
          @edit="openEditModal"
          @delete="openDeleteModal"
        />
      </PageLoading>
    </a-card>

    <KbProjectEditModal
      v-if="editingProject"
      v-model:open="editVisible"
      :project="editingProject"
      @success="onEditSuccess"
    />

    <KbProjectDeleteModal
      v-if="deletingProject"
      v-model:open="deleteVisible"
      :project="deletingProject"
      @success="onDeleteSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { getKbProjectList } from '@/api/knowledge'
import ListEmptyGuide from '@/components/common/ListEmptyGuide.vue'
import PageLoading from '@/components/common/PageLoading.vue'
import KbProjectDeleteModal from '@/components/knowledge/KbProjectDeleteModal.vue'
import KbProjectEditModal from '@/components/knowledge/KbProjectEditModal.vue'
import KbProjectQueryBar from '@/components/knowledge/KbProjectQueryBar.vue'
import KbProjectTable from '@/components/knowledge/KbProjectTable.vue'
import { useFilteredPaginatedList } from '@/composables/useFilteredPaginatedList'
import type { KbProject } from '@/types/knowledge'
import {
  createEmptyKbProjectListFilters,
  kbProjectListFiltersToQuery,
} from '@/utils/knowledgeQuery'

const editVisible = ref(false)
const editingProject = ref<KbProject | null>(null)
const deleteVisible = ref(false)
const deletingProject = ref<KbProject | null>(null)

const {
  filterForm,
  loading,
  list: kbProjectList,
  pagination,
  loadPage,
  handleSearch,
  handleReset,
} = useFilteredPaginatedList<KbProject, ReturnType<typeof createEmptyKbProjectListFilters>>(
  async (params) => (await getKbProjectList(params)).data,
  {
    createEmptyFilters: createEmptyKbProjectListFilters,
    filtersToQuery: kbProjectListFiltersToQuery,
    pageSize: 10,
  },
)

/** 打开编辑弹窗 */
function openEditModal(project: KbProject) {
  editingProject.value = project
  editVisible.value = true
}

/** 打开删除确认弹窗 */
function openDeleteModal(project: KbProject) {
  deletingProject.value = project
  deleteVisible.value = true
}

/** 编辑成功后更新列表项 */
function onEditSuccess(updated: KbProject) {
  editingProject.value = null

  const index = kbProjectList.value.findIndex(
    (item) => item.kbProjectId === updated.kbProjectId,
  )
  if (index >= 0) {
    kbProjectList.value[index] = updated
  }
}

/** 删除成功后更新列表；若当前页删空且非第一页则回退一页 */
async function onDeleteSuccess() {
  const deletedId = deletingProject.value?.kbProjectId
  deletingProject.value = null

  if (!deletedId) {
    await loadPage()
    return
  }

  kbProjectList.value = kbProjectList.value.filter((item) => item.kbProjectId !== deletedId)

  if (typeof pagination.total === 'number' && pagination.total > 0) {
    pagination.total -= 1
  }

  if (kbProjectList.value.length === 0 && (pagination.current ?? 1) > 1) {
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
