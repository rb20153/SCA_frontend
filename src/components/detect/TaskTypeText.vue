<template>
  <a-tag :color="TASK_TYPE_TAG_COLOR[taskType]" class="task-type-tag">
    {{ TASK_TYPE_LABEL[taskType] }}
  </a-tag>
</template>

<script setup lang="ts">
import type { TaskType } from '@/types/common'
import { TASK_TYPE_LABEL, TASK_TYPE_TAG_COLOR } from '@/utils/taskDisplay'

defineProps<{
  taskType: TaskType
}>()
</script>

<style scoped>
.task-type-tag {
  margin: 0;
}
</style>
