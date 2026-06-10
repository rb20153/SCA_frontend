<template>
  <div class="create-bar">
    <a-button type="primary" @click="handleAdd">
      <template #icon>
        <PlusOutlined />
      </template>
      添加策略
    </a-button>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { PlusOutlined } from '@ant-design/icons-vue'

const router = useRouter()

/** 跳转策略编辑器页（新建策略） */
function handleAdd() {
  router.push('/policies/new/edit')
}
</script>

<style scoped>
.create-bar {
  margin-bottom: 16px;
}
</style>
