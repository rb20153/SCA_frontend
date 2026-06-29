<template>
  <div class="create-bar">
    <a-button type="primary" @click="emit('add')">
      <template #icon>
        <PlusOutlined />
      </template>
      添加策略
    </a-button>
  </div>
</template>

<script setup lang="ts">
import { PlusOutlined } from '@ant-design/icons-vue'

const emit = defineEmits<{
  add: []
}>()
</script>

<style scoped>
.create-bar {
  margin-bottom: 16px;
}
</style>
