import { getTaskList } from '@/api/detect'
import { useRoute } from 'vue-router'
import { useFilteredPaginatedList } from '@/composables/useFilteredPaginatedList'
import type { TaskType } from '@/types/common'
import type { DetectTask } from '@/types/detect'
import { createEmptyTaskListFilters, taskListFiltersToQuery } from '@/utils/taskQuery'

/**
 * 自主率 / 开源风险分类列表页共用：固定 taskType 筛选，分页与行内操作回调
 * @param fixedTaskType - 页面绑定的检测类型
 */
export function useDetectTaskListPage(fixedTaskType: TaskType) {
  const route = useRoute()
  const listState = useFilteredPaginatedList<
    DetectTask,
    ReturnType<typeof createEmptyTaskListFilters>
  >(
    async (params) =>
      (await getTaskList({ ...params, taskType: fixedTaskType, taskId: typeof route.query.taskId === 'string' ? route.query.taskId : undefined })).data,
    {
      createEmptyFilters: createEmptyTaskListFilters,
      filtersToQuery: (filters) => {
        const query = taskListFiltersToQuery(filters)
        delete query.taskType
        return query
      },
      pageSize: 10,
      immediate: true,
    },
  )

  /** 创建任务成功后刷新列表到第一页 */
  async function onTaskCreated() {
    listState.pagination.current = 1
    await listState.loadPage()
  }

  /** 行内编辑成功后同步更新当前页列表数据 */
  function onTaskUpdated(updated: DetectTask) {
    const index = listState.list.value.findIndex(
      (item) => item.taskId === updated.taskId,
    )
    if (index >= 0) {
      listState.list.value[index] = updated
    }
  }

  /** 删除任务后更新列表；若当前页删空且非第一页则回退一页 */
  async function onTaskDeleted(taskId: string) {
    listState.list.value = listState.list.value.filter(
      (item) => item.taskId !== taskId,
    )
    if (typeof listState.pagination.total === 'number' && listState.pagination.total > 0) {
      listState.pagination.total -= 1
    }
    if (
      listState.list.value.length === 0 &&
      (listState.pagination.current ?? 1) > 1
    ) {
      listState.pagination.current = (listState.pagination.current ?? 1) - 1
      await listState.loadPage()
    }
  }

  return {
    ...listState,
    onTaskCreated,
    onTaskUpdated,
    onTaskDeleted,
  }
}
