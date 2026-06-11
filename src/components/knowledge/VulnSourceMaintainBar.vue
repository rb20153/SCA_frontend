<template>
  <div class="maintain-bar">
    <a-space :size="8">
      <a-button type="primary" @click="emit('sync-all')">全库同步</a-button>
      <a-button @click="emit('import')">导入离线漏洞包</a-button>
    </a-space>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  'sync-all': []
  import: []
}>()
</script>

<style scoped>
.maintain-bar {
  margin-bottom: 16px;
}
</style>
