<template>
  <a-tabs v-model:active-key="activeKey" class="page-nav-tabs" @change="handleChange">
    <a-tab-pane v-for="tab in tabs" :key="tab.key" :tab="tab.label" />
  </a-tabs>
</template>

<script setup lang="ts">
import type { PageNavTabItem } from '@/types/common'

defineProps<{
  /** Tab 配置项 */
  tabs: PageNavTabItem[]
}>()

const activeKey = defineModel<string>('activeKey', { required: true })

const emit = defineEmits<{
  change: [key: string]
}>()

/** Tab 切换时向父组件抛出当前 key */
function handleChange(key: string | number) {
  emit('change', String(key))
}
</script>

<style scoped>
.page-nav-tabs {
  margin-bottom: 16px;
}

.page-nav-tabs :deep(.ant-tabs-nav) {
  margin-bottom: 0;
}
</style>
