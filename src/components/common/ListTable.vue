<template>
  <div class="list-table-wrap">
    <a-table
      :columns="normalizedColumns"
      :data-source="dataSource"
      :loading="loading"
      :pagination="pagination"
      :scroll="scrollX ? { x: scrollX } : undefined"
      :row-key="rowKey"
      :row-class-name="rowClassNameFn"
      size="middle"
    >
      <template #bodyCell="scope">
        <slot name="bodyCell" v-bind="scope">
          <ListTableCell :column="scope.column" :text="scope.text" />
        </slot>
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts" generic="T extends object">
import { computed } from 'vue'
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue'
import ListTableCell from '@/components/common/ListTableCell.vue'
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
    /** 按行返回 tr 的 class，用于未读高亮等 */
    rowClassName?: (record: T) => string
  }>(),
  {
    loading: false,
    pagination: false,
  },
)

/** 补齐列表表头默认居中 */
const normalizedColumns = computed(() => withListColumnDefaults(props.columns))

/** 适配 a-table row-class-name 签名 */
function rowClassNameFn(record: T): string {
  return props.rowClassName?.(record) ?? ''
}
</script>

<style scoped>
.list-table-wrap {
  width: 100%;
  overflow: hidden;
}

.list-table-wrap :deep(.ant-table-cell) {
  overflow: hidden;
}
</style>
