<template>
  <span class="action-cell">
    <router-link :to="directoryTo" class="list-table-link">项目目录</router-link>
    <router-link :to="versionsTo" class="list-table-link">版本管理</router-link>
    <a href="#" class="list-table-link" @click.prevent="emit('edit', project)">编辑</a>
    <a
      href="#"
      class="list-table-link list-table-link--danger"
      @click.prevent="emit('delete', project)"
    >
      删除
    </a>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouteWithFrom } from '@/composables/useRouteWithFrom'
import type { KbProject } from '@/types/knowledge'
import { createNavigationState } from '@/utils/navigation'

const props = defineProps<{
  project: KbProject
}>()

const emit = defineEmits<{
  edit: [project: KbProject]
  delete: [project: KbProject]
}>()

const { withFrom } = useRouteWithFrom()

/** 项目目录页路由（携带项目信息 + from 供顶栏返回） */
const directoryTo = computed(() =>
  withFrom({
    name: 'KbProjectDirectory',
    params: { kbProjectId: props.project.kbProjectId },
    state: createNavigationState({ kbProject: props.project }),
  }),
)

/** 版本管理页路由（携带项目信息 + from 供顶栏返回） */
const versionsTo = computed(() =>
  withFrom({
    name: 'KbVersionManage',
    params: { kbProjectId: props.project.kbProjectId },
    state: createNavigationState({ kbProject: props.project }),
  }),
)
</script>

<style scoped>
.action-cell {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px 12px;
}
</style>
