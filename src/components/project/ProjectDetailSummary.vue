<template>
  <div class="stat-card-row stat-card-row--cols-4">
    <StatCard label="项目名称" :value="project.projectName" />
    <StatCard label="负责人" :value="project.owner" />
    <StatCard label="状态" value="">
      <template #value>
        <a-tag :color="PROJECT_STATUS_COLOR[project.status]" class="project-status-tag">
          {{ PROJECT_STATUS_LABEL[project.status] }}
        </a-tag>
      </template>
    </StatCard>
    <StatCard label="创建时间" :value="formatProjectDateTime(project.createdAt)" />
  </div>
</template>

<script setup lang="ts">
import StatCard from '@/components/common/StatCard.vue'
import type { Project } from '@/types/project'
import {
  PROJECT_STATUS_COLOR,
  PROJECT_STATUS_LABEL,
  formatProjectDateTime,
} from '@/utils/projectDisplay'

defineProps<{
  /** 当前项目摘要信息 */
  project: Project
}>()
</script>

<style scoped>
.stat-card-row {
  display: grid;
  gap: 16px;
  margin-bottom: 16px;
}

.stat-card-row--cols-4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.project-status-tag {
  margin-inline-end: 0;
}

@media (max-width: 1200px) {
  .stat-card-row--cols-4 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 576px) {
  .stat-card-row--cols-4 {
    grid-template-columns: 1fr;
  }
}
</style>
