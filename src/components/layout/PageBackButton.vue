<template>
  <a-button
    v-if="visible"
    type="text"
    class="page-back-btn"
    title="返回"
    aria-label="返回"
    @click="goBack"
  >
    <ArrowLeftOutlined />
  </a-button>
</template>

<script setup lang="ts">
import { ArrowLeftOutlined } from '@ant-design/icons-vue'
import { usePageBack } from '@/composables/usePageBack'

const { visible, goBack } = usePageBack()
</script>

<style scoped>
.page-back-btn {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  padding: 0;
  margin-right: 4px;
  font-size: 16px;
  color: rgba(0, 0, 0, 0.65);
}

.page-back-btn:hover {
  color: #1677ff;
}
</style>
