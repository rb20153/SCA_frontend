<template>
  <div class="create-bar">
    <a-button v-if="canWrite('/policies')" type="primary" @click="emit('add')">
      <template #icon>
        <PlusOutlined />
      </template>
      添加策略
    </a-button>
  </div>
</template>

<script setup lang="ts">
import { PlusOutlined } from '@ant-design/icons-vue'
import { usePagePermission } from '@/composables/usePagePermission'
const { canWrite } = usePagePermission()

const emit = defineEmits<{
  add: []
}>()
</script>

<style scoped>
.create-bar {
  margin-bottom: 16px;
}
</style>
