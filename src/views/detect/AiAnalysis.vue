<template>
  <div class="ai-analysis-page">
    <div class="page-actions">
      <a-button v-if="canWrite('/detect/ai-analysis')" type="primary" @click="startModalVisible = true">开始 AI 解析</a-button>
    </div>

    <AiParseQueryBar
      v-model="filterForm"
      @search="handleSearch"
      @reset="handleReset"
    />

    <a-card :bordered="false" class="table-card">
      <PageLoading :loading="loading && tasks.length === 0">
        <ListEmptyGuide
          v-if="!loading && tasks.length === 0"
          title="暂无解析记录"
          description="点击「开始 AI 解析」提交首个任务"
        />
        <AiParseTaskTable
          v-else
          :tasks="tasks"
          :loading="loading"
          :pagination="pagination"
          @view-result="openResultDrawer"
          @fallback="openFallbackModal"
        />
      </PageLoading>
    </a-card>

    <AiParseStartModal v-model:open="startModalVisible" @success="handleTaskCreated" />

    <AiParseResultDrawer
      v-model:open="resultDrawerVisible"
      :task="selectedTask"
    />

    <AiParseFallbackModal
      v-model:open="fallbackModalVisible"
      :task="selectedTask"
      @success="handleFallbackSubmitted"
    />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { getAiParseTaskList } from '@/api/detect'
import ListEmptyGuide from '@/components/common/ListEmptyGuide.vue'
import PageLoading from '@/components/common/PageLoading.vue'
import AiParseFallbackModal from '@/components/detect/AiParseFallbackModal.vue'
import AiParseQueryBar from '@/components/detect/AiParseQueryBar.vue'
import AiParseResultDrawer from '@/components/detect/AiParseResultDrawer.vue'
import AiParseStartModal from '@/components/detect/AiParseStartModal.vue'
import AiParseTaskTable from '@/components/detect/AiParseTaskTable.vue'
import { useFilteredPaginatedList } from '@/composables/useFilteredPaginatedList'
import { usePagePermission } from '@/composables/usePagePermission'
import type { AiParseTask } from '@/types/detect'
import {
  aiParseTaskListFiltersToQuery,
  createEmptyAiParseTaskListFilters,
} from '@/utils/aiParseQuery'

const startModalVisible = ref(false)
const resultDrawerVisible = ref(false)
const fallbackModalVisible = ref(false)
const selectedTask = ref<AiParseTask | null>(null)
const { canWrite } = usePagePermission()

/** 打开解析结果抽屉 */
function openResultDrawer(task: AiParseTask) {
  selectedTask.value = task
  resultDrawerVisible.value = true
}

/** 打开规则回退弹窗 */
function openFallbackModal(task: AiParseTask) {
  if (!canWrite('/detect/ai-analysis')) return
  selectedTask.value = task
  fallbackModalVisible.value = true
}

/** 创建任务成功后刷新列表 */
async function handleTaskCreated() {
  await loadPage()
}

/** 规则回退提交成功后刷新列表 */
async function handleFallbackSubmitted() {
  await loadPage()
}

const {
  filterForm,
  loading,
  list: tasks,
  pagination,
  loadPage,
  handleSearch,
  handleReset,
} = useFilteredPaginatedList<
  AiParseTask,
  ReturnType<typeof createEmptyAiParseTaskListFilters>
>(
  async (params) => (await getAiParseTaskList(params)).data,
  {
    createEmptyFilters: createEmptyAiParseTaskListFilters,
    filtersToQuery: aiParseTaskListFiltersToQuery,
    pageSize: 10,
  },
)

let pollingTimer: ReturnType<typeof setInterval> | undefined

watch(
  () => tasks.value.some((task) => task.status === 'running'),
  (hasRunningTask) => {
    if (pollingTimer) clearInterval(pollingTimer)
    pollingTimer = hasRunningTask
      ? setInterval(() => {
          if (!loading.value) loadPage()
        }, 2_000)
      : undefined
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (pollingTimer) clearInterval(pollingTimer)
})
</script>

<style scoped>
.ai-analysis-page {
  min-height: 100%;
}

.page-actions {
  margin-bottom: 16px;
}

.table-card {
  margin-bottom: 0;
}
</style>
