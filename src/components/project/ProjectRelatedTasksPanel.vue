<template>
  <div class="related-tasks-panel">
    <div class="create-bar">
      <DetectTaskCreateBar variant="picker" @created="onTaskCreated" />
    </div>

    <PageLoading :loading="loading && taskList.length === 0">
      <ListEmptyGuide
        v-if="!loading && taskList.length === 0"
        title="暂无关联任务"
        hint-before="该项目还没有检测任务，前往"
        :link-to="detectTasksPath"
        link-text="检测任务"
        hint-after="创建并执行扫描"
      />
      <DetectTaskTable
        v-else
        :tasks="taskList"
        :loading="loading"
        :pagination="pagination"
        hide-project-column
      />
    </PageLoading>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { getProjectRelatedTasks } from '@/api/project'
import ListEmptyGuide from '@/components/common/ListEmptyGuide.vue'
import PageLoading from '@/components/common/PageLoading.vue'
import DetectTaskCreateBar from '@/components/detect/DetectTaskCreateBar.vue'
import DetectTaskTable from '@/components/detect/DetectTaskTable.vue'
import { usePaginatedList } from '@/composables/usePaginatedList'
import type { DetectTask } from '@/types/detect'
import type { Project } from '@/types/project'
import { verifyProjectRelatedTasks } from '@/utils/projectDisplay'
import { DETECT_AUTONOMY_LIST_PATH } from '@/utils/taskDisplay'

const props = defineProps<{
  /** 当前项目，用于请求关联任务并二次校验项目名 */
  project: Project
  /** 关联任务 Tab 是否处于激活态 */
  visible: boolean
}>()

/** 检测任务页路径（携带 from 便于返回） */
const detectTasksPath = DETECT_AUTONOMY_LIST_PATH

/** 创建任务成功后刷新关联任务列表 */
async function onTaskCreated() {
  pagination.current = 1
  await loadPage()
}

const {
  loading,
  list: taskList,
  pagination,
  loadPage,
} = usePaginatedList<DetectTask>(
  async (params) => {
    const res = await getProjectRelatedTasks(props.project.projectId, params)
    return {
      ...res.data,
      list: verifyProjectRelatedTasks(res.data.list, props.project),
    }
  },
  { pageSize: 10, immediate: false },
)

/** 切换到关联任务 Tab 时再请求列表，避免挂载 router-link 干扰 history.state */
watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      loadPage()
    }
  },
  { immediate: true },
)
</script>

<style scoped>
.related-tasks-panel {
  min-height: 200px;
}

.create-bar {
  margin-bottom: 16px;
}
</style>
