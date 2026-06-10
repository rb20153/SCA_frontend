<template>
  <div class="page-container">
    <a-result
      status="info"
      title="报告模板编辑器"
      :sub-title="`模板 ID：${templateId}，页面开发中`"
    >
      <template #extra>
        <a-button type="primary" @click="router.push('/reports/templates')">
          返回模板列表
        </a-button>
      </template>
    </a-result>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

/** 当前编辑的模板 ID */
const templateId = computed(() => String(route.params.templateId ?? ''))
</script>

<style scoped>
.page-container {
  min-height: 100%;
  padding: 24px;
}
</style>
