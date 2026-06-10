<template>
  <a-card :bordered="false" class="list-query-card">
    <a-form layout="inline" class="list-query-form" @submit.prevent="emit('search')">
      <!-- 各业务页通过默认插槽注入筛选项 -->
      <slot />

      <a-form-item class="list-query-actions">
        <a-space>
          <a-button type="primary" html-type="submit">查询</a-button>
          <a-button @click="emit('reset')">重置</a-button>
          <slot name="extra-actions" />
        </a-space>
      </a-form-item>
    </a-form>
  </a-card>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  search: []
  reset: []
}>()
</script>

<style scoped>
.list-query-card {
  margin-bottom: 16px;
}

.list-query-form {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 0;
}

.list-query-form :deep(.ant-form-item) {
  margin-bottom: 8px;
}

.list-query-actions :deep(.ant-form-item-control-input-content) {
  display: flex;
}
</style>

<!-- 插槽内表单项可复用的宽度工具类 -->
<style>
.list-query-input {
  width: 180px;
}

.list-query-select {
  width: 160px;
}

.list-query-date {
  width: 180px;
}

.list-query-datetime {
  width: 200px;
}

.list-query-datetime-range {
  width: 360px;
}

.list-query-input-wide {
  width: 240px;
}
</style>
