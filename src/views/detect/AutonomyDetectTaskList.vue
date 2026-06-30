<template>
  <div class="page-container">
    <DetectTaskCreateBar variant="autonomy" @created="onTaskCreated" />

    <DetectTaskQueryBar
      v-model="filterForm"
      hide-task-type
      @search="handleSearch"
      @reset="handleReset"
    />

    <a-card :bordered="false" class="table-card">
      <PageLoading :loading="loading && taskList.length === 0">
        <ListEmptyGuide
          v-if="!loading && taskList.length === 0"
          title="暂无自主率检测任务"
          description="点击上方按钮创建自主率检测任务"
        />
        <DetectTaskTable
          v-else
          :tasks="taskList"
          :loading="loading"
          :pagination="pagination"
          hide-task-type
          source-mode-column-title="模式"
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
import ListEmptyGuide from '@/components/common/ListEmptyGuide.vue'
import PageLoading from '@/components/common/PageLoading.vue'
import DetectTaskCreateBar from '@/components/detect/DetectTaskCreateBar.vue'
import DetectTaskQueryBar from '@/components/detect/DetectTaskQueryBar.vue'
import DetectTaskTable from '@/components/detect/DetectTaskTable.vue'
import { useDetectTaskListPage } from '@/composables/useDetectTaskListPage'

const {
  filterForm,
  loading,
  list: taskList,
  pagination,
  handleSearch,
  handleReset,
  onTaskCreated,
  onTaskUpdated,
  onTaskDeleted,
} = useDetectTaskListPage('autonomy')
</script>

<style scoped>
.page-container {
  min-height: 100%;
}
</style>
