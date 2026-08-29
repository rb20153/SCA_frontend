<template>
  <span class="action-cell">
    <a v-if="canWrite('/projects')" href="#" class="list-table-link" @click.prevent="emit('edit', project)">编辑</a>
    <router-link :to="detailTo" class="list-table-link">详情</router-link>
    <a v-if="canWrite('/projects')" href="#" class="list-table-link list-table-link--danger" @click.prevent="emit('delete', project)">
      删除
    </a>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouteWithFrom } from '@/composables/useRouteWithFrom'
import type { Project } from '@/types/project'
import { createNavigationState } from '@/utils/navigation'
import { usePagePermission } from '@/composables/usePagePermission'

const props = defineProps<{
  project: Project
}>()

const emit = defineEmits<{
  edit: [project: Project]
  delete: [project: Project]
}>()

const { withFrom } = useRouteWithFrom()
const { canWrite } = usePagePermission()

/** 项目详情页路由（携带列表项数据） */
const detailTo = computed(() =>
  withFrom({
    name: 'ProjectDetail',
    params: { projectId: props.project.projectId },
    state: createNavigationState({ project: props.project }),
  }),
)
</script>

<style scoped>
.action-cell {
  display: inline-flex;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: center;
  gap: 12px;
  white-space: nowrap;
}
</style>
