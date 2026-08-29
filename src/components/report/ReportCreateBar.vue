<template>
  <div class="create-bar">
    <a-button v-if="canWrite('/reports')" type="primary" @click="emit('generate')">
      生成检测报告
    </a-button>
  </div>
</template>

<script setup lang="ts">
import { usePagePermission } from '@/composables/usePagePermission'
const { canWrite } = usePagePermission()
const emit = defineEmits<{
  generate: []
}>()
</script>

<style scoped>
.create-bar {
  margin-bottom: 16px;
}
</style>
