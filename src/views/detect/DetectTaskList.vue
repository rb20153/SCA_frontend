<template>
  <div class="page-container">
    <DetectTaskCreateBar @created="onTaskCreated" />

    <DetectTaskQueryBar
      v-model="filterForm"
      @search="handleSearch"
      @reset="handleReset"
    />

    <a-card :bordered="false" class="table-card">
      <PageLoading :loading="loading && taskList.length === 0">
        <ListEmptyGuide
          v-if="!loading && taskList.length === 0"
          title="暂无检测任务"
          description="点击上方按钮创建自主率检测或开源风险检测任务"
        />
        <DetectTaskTable
          v-else
          :tasks="taskList"
          :loading="loading"
          :pagination="pagination"
          show-source-mode
          show-full-actions
          @task-updated="onTaskUpdated"
          @task-deleted="onTaskDeleted"
        />
      </PageLoading>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { getTaskList } from '@/api/detect'
import ListEmptyGuide from '@/components/common/ListEmptyGuide.vue'
import PageLoading from '@/components/common/PageLoading.vue'
import DetectTaskCreateBar from '@/components/detect/DetectTaskCreateBar.vue'
import DetectTaskQueryBar from '@/components/detect/DetectTaskQueryBar.vue'
import DetectTaskTable from '@/components/detect/DetectTaskTable.vue'
import { useFilteredPaginatedList } from '@/composables/useFilteredPaginatedList'
import type { DetectTask } from '@/types/detect'
import { createEmptyTaskListFilters, taskListFiltersToQuery } from '@/utils/taskQuery'

const {
  filterForm,
  loading,
  list: taskList,
  pagination,
  loadPage,
  handleSearch,
  handleReset,
} = useFilteredPaginatedList<DetectTask, ReturnType<typeof createEmptyTaskListFilters>>(
  async (params) => (await getTaskList(params)).data,
  {
    createEmptyFilters: createEmptyTaskListFilters,
    filtersToQuery: taskListFiltersToQuery,
    pageSize: 10,
  },
)

/** 创建任务成功后刷新列表到第一页 */
async function onTaskCreated() {
  pagination.current = 1
  await loadPage()
}

/** 行内编辑成功后同步更新当前页列表数据 */
function onTaskUpdated(updated: DetectTask) {
  const index = taskList.value.findIndex((item) => item.taskId === updated.taskId)
  if (index >= 0) {
    taskList.value[index] = updated
  }
}

/** 删除任务后更新列表；若当前页删空且非第一页则回退一页 */
async function onTaskDeleted(taskId: string) {
  taskList.value = taskList.value.filter((item) => item.taskId !== taskId)
  if (typeof pagination.total === 'number' && pagination.total > 0) {
    pagination.total -= 1
  }
  if (taskList.value.length === 0 && (pagination.current ?? 1) > 1) {
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
