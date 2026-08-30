<template>
  <div v-if="canWrite('/knowledge/quarter-updates')" class="maintain-bar">
    <a-space :size="8">
      <a-button type="primary" @click="emit('start')">开始季度更新</a-button>
      <a-button @click="emit('rollback')">季度回滚</a-button>
    </a-space>
  </div>
</template>

<script setup lang="ts">
import { usePagePermission } from '@/composables/usePagePermission'

const { canWrite } = usePagePermission()

const emit = defineEmits<{
  start: []
  rollback: []
}>()
</script>

<style scoped>
.maintain-bar {
  margin-bottom: 16px;
}
</style>
