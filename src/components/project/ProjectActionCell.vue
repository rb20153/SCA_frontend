<template>
  <span class="action-cell">
    <router-link :to="detailPath" class="list-table-link">编辑</router-link>
    <a href="#" class="list-table-link list-table-link--danger" @click.prevent="emit('delete', project)">
      删除
    </a>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Project } from '@/types/project'

const props = defineProps<{
  project: Project
}>()

const emit = defineEmits<{
  delete: [project: Project]
}>()

/** 项目详情页路由 */
const detailPath = computed(() => `/projects/${props.project.projectId}`)
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
