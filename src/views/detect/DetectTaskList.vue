<template>

  <div class="page-container">

    <DetectTaskCreateBar

      @create-autonomy="onCreateAutonomy"

      @create-risk="onCreateRisk"

    />



    <DetectTaskQueryBar

      v-model="filterForm"

      @search="handleSearch"

      @reset="handleReset"

    />



    <a-card :bordered="false" class="table-card">

      <a-empty v-if="!loading && taskList.length === 0" description="暂无检测任务" />

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

    </a-card>

  </div>

</template>



<script setup lang="ts">

import { message } from 'ant-design-vue'

import { getTaskList } from '@/api/detect'

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



function onCreateAutonomy() {

  message.info('创建自主率检测任务（开发中）')

}



function onCreateRisk() {

  message.info('创建开源风险检测任务（开发中）')

}



function onTaskUpdated(updated: DetectTask) {

  const index = taskList.value.findIndex((item) => item.taskId === updated.taskId)

  if (index >= 0) {

    taskList.value[index] = updated

  }

}



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

