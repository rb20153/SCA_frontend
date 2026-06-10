<template>
  <a-spin :spinning="loading" :tip="tip" size="large" class="page-loading">
    <div
      class="page-loading__body"
      :class="{ 'page-loading__body--route': routeMode }"
    >
      <slot />
    </div>
  </a-spin>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    /** 是否显示加载遮罩 */
    loading: boolean
    /** 加载提示文案 */
    tip?: string
    /** 路由切换模式：为内容区预留最小高度，避免切换时布局跳动 */
    routeMode?: boolean
  }>(),
  {
    tip: '加载中...',
    routeMode: false,
  },
)
</script>

<style scoped>
.page-loading {
  display: block;
  width: 100%;
}

.page-loading :deep(.ant-spin-container) {
  width: 100%;
}

.page-loading__body {
  width: 100%;
}

.page-loading__body--route {
  min-height: calc(100vh - 56px - 48px - 48px);
}
</style>
