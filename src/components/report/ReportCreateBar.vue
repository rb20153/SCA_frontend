<template>
  <div class="create-bar">
    <a-button type="primary" @click="emit('generate')">
      生成检测报告
    </a-button>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  generate: []
}>()
</script>

<style scoped>
.create-bar {
  margin-bottom: 16px;
}
</style>
