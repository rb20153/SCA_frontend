<template>
  <div class="list-table-wrap">
    <a-table
      :columns="normalizedColumns"
      :data-source="dataSource"
      :loading="loading"
      :pagination="pagination"
      :scroll="scrollX ? { x: scrollX } : undefined"
      :row-key="rowKey"
      size="middle"
    >
      <template v-if="$slots.bodyCell" #bodyCell="scope">
        <slot name="bodyCell" v-bind="scope" />
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts" generic="T extends Record<string, unknown>">
import { computed } from 'vue'
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue'
import { withListColumnDefaults } from '@/utils/listTable'

const props = withDefaults(
  defineProps<{
    /** 表格列定义（align 默认居中） */
    columns: TableColumnsType<T>
    /** 行数据 */
    dataSource: T[]
    /** 行唯一键字段名或函数 */
    rowKey: string | ((record: T) => string)
    /** 横向滚动宽度；不传则不启用 scroll */
    scrollX?: number
    loading?: boolean
    /** 分页配置；首页简表等场景传 false */
    pagination?: TablePaginationConfig | false
  }>(),
  {
    loading: false,
    pagination: false,
  },
)

/** 补齐列表表头默认居中 */
const normalizedColumns = computed(() => withListColumnDefaults(props.columns))
</script>

<style scoped>
.list-table-wrap {
  width: 100%;
  overflow: hidden;
}
</style>

<!-- 列表单元格常用样式，供业务表格 bodyCell 插槽内 class 复用 -->
<style>
.list-table-link {
  color: #1677ff;
}

.list-table-link--danger {
  color: #ff4d4f;
}

.list-table-status-tag {
  margin: 0;
}

.list-table-action-dash {
  color: rgba(0, 0, 0, 0.25);
}
</style>
