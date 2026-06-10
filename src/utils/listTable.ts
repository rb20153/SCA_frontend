import type { TableColumnsType } from 'ant-design-vue'

/**
 * 为列表表头列补齐默认样式：表头与单元格居中
 * @param columns - 业务表格列定义
 */
export function withListColumnDefaults<T>(columns: TableColumnsType<T>): TableColumnsType<T> {
  return columns.map((column) => ({
    ...column,
    align: column.align ?? 'center',
  }))
}
