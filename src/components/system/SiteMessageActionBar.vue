<template>
  <div class="action-bar">
    <a-button type="primary" :loading="loading" @click="emit('mark-all-read')">
      全部标为已读
    </a-button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  loading?: boolean
}>()

const emit = defineEmits<{
  'mark-all-read': []
}>()
</script>

<style scoped>
.action-bar {
  margin-bottom: 16px;
}
</style>
