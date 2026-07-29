import type { PageResult } from '@/types/common'

/**
 * 将后端分页结构规范为前端 PageResult（兼容 list / items / records）
 */
export function normalizePageResult<T>(
  raw: unknown,
  mapItem: (item: Record<string, unknown>) => T,
): PageResult<T> {
  if (Array.isArray(raw)) {
    const list = raw.map((item) =>
      mapItem(item && typeof item === 'object' ? (item as Record<string, unknown>) : {}),
    )
    return {
      list,
      total: list.length,
      page: 1,
      pageSize: list.length || 10,
    }
  }

  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const listRaw = obj.list ?? obj.items ?? obj.records ?? []
  const list = Array.isArray(listRaw)
    ? listRaw.map((item) => mapItem(item as Record<string, unknown>))
    : []

  return {
    list,
    total: Number(obj.total ?? list.length),
    page: Number(obj.page ?? obj.current ?? 1),
    pageSize: Number(obj.pageSize ?? obj.size ?? (list.length || 10)),
  }
}

/**
 * 将后端数组或 { list/items } 规范为数组
 */
export function normalizeList<T>(
  raw: unknown,
  mapItem: (item: Record<string, unknown>) => T,
): T[] {
  if (Array.isArray(raw)) {
    return raw.map((item) => mapItem(item as Record<string, unknown>))
  }
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>
    const listRaw = obj.list ?? obj.items ?? obj.records
    if (Array.isArray(listRaw)) {
      return listRaw.map((item) => mapItem(item as Record<string, unknown>))
    }
  }
  return []
}
