import type { TableColumnType, TableColumnsType } from 'ant-design-vue'

/** 不使用单行省略的列（标签、进度、操作等） */
const NON_ELLIPSIS_COLUMN_KEYS = new Set([
  'action',
  'progress',
  'status',
  'level',
  'taskType',
  'category',
  'collectMode',
  'sourceMode',
  'outputFormat',
  'visibility',
  'isDefault',
])

/**
 * 判断列表列是否应启用单行省略 + tooltip
 * @param column - 表格列配置
 */
export function shouldColumnEllipsis(column: TableColumnType): boolean {
  if (column.ellipsis === false) {
    return false
  }

  const key = String(column.key ?? '')
  if (NON_ELLIPSIS_COLUMN_KEYS.has(key)) {
    return false
  }

  if (column.ellipsis === true) {
    return true
  }

  return typeof column.dataIndex === 'string' && column.dataIndex.length > 0
}

/**
 * 为列表表头列补齐默认样式：表头与单元格居中；文本列默认 ellipsis
 * @param columns - 业务表格列定义
 */
export function withListColumnDefaults<T extends object>(
  columns: TableColumnsType<T>,
): TableColumnsType<T> {
  return columns.map((column) => {
    const useEllipsis = shouldColumnEllipsis(column)

    return {
      ...column,
      align: column.align ?? 'center',
      ellipsis: useEllipsis ? true : column.ellipsis,
    }
  })
}
