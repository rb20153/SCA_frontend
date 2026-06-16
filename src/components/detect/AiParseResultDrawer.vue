<template>
  <a-drawer
    v-model:open="visible"
    :title="drawerTitle"
    placement="right"
    :width="640"
    destroy-on-close
    :footer="null"
  >
    <a-empty description="解析结果内容开发中" />
  </a-drawer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { AiParseTask } from '@/types/detect'

const props = defineProps<{
  /** 当前查看结果的解析任务 */
  task: AiParseTask | null
}>()

const visible = defineModel<boolean>('open', { required: true })

/** 抽屉标题含解析对象名 */
const drawerTitle = computed(() => {
  if (!props.task) {
    return '解析结果'
  }
  return `解析结果 · ${props.task.parseObjectName}`
})
</script>
