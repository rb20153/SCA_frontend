<template>
  <div class="create-bar">
    <a-button type="primary" @click="emit('create')">
      <template #icon>
        <PlusOutlined />
      </template>
      新增项目
    </a-button>
  </div>
</template>

<script setup lang="ts">
import { PlusOutlined } from '@ant-design/icons-vue'

const emit = defineEmits<{
  create: []
}>()
</script>

<style scoped>
.create-bar {
  margin-bottom: 16px;
}
</style>
