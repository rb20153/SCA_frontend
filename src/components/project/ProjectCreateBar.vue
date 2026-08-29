<template>
  <div class="create-bar">
    <a-button v-if="canWrite('/projects')" type="primary" @click="emit('create')">
      <template #icon>
        <PlusOutlined />
      </template>
      新增项目
    </a-button>
  </div>
</template>

<script setup lang="ts">
import { PlusOutlined } from '@ant-design/icons-vue'
import { usePagePermission } from '@/composables/usePagePermission'

const { canWrite } = usePagePermission()

const emit = defineEmits<{
  create: []
}>()
</script>

<style scoped>
.create-bar {
  margin-bottom: 16px;
}
</style>
