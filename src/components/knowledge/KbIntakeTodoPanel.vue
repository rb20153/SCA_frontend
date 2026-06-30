<template>
  <a-card :bordered="false" class="kb-intake-todo-panel" title="入库待办">
    <PageLoading :loading="loading && todoList.length === 0">
      <ListEmptyGuide
        v-if="!loading && todoList.length === 0"
        title="暂无入库待办"
        description="当前没有进行中的入库任务"
      />
      <KbIntakeTodoTable
        v-else
        :items="todoList"
        :loading="loading"
        :pagination="pagination"
      />
    </PageLoading>
  </a-card>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { getKbIntakeTodoList } from '@/api/knowledge'
import ListEmptyGuide from '@/components/common/ListEmptyGuide.vue'
import PageLoading from '@/components/common/PageLoading.vue'
import KbIntakeTodoTable from '@/components/knowledge/KbIntakeTodoTable.vue'
import { usePaginatedList } from '@/composables/usePaginatedList'
import type { KbIntakeTodoItem } from '@/types/knowledge'

const {
  loading,
  list: todoList,
  pagination,
  refresh,
} = usePaginatedList<KbIntakeTodoItem>(
  async (params) => (await getKbIntakeTodoList(params)).data,
  { pageSize: 4, immediate: false },
)

onMounted(() => {
  void refresh()
})

/** 供父级刷新待办列表 */
defineExpose({
  refresh,
})
</script>

<style scoped>
.kb-intake-todo-panel {
  width: 100%;
  height: 100%;
}

.kb-intake-todo-panel :deep(.ant-card-body) {
  min-height: 280px;
}
</style>
