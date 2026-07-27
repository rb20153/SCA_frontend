import type { UserSearchCandidate, DepartmentOption } from '@/types/user'
import { normalizeList } from '@/utils/pageResultAdapter'

/** 将后端用户搜索项规范为 UserSearchCandidate */
export function normalizeUserSearchCandidate(raw: Record<string, unknown>): UserSearchCandidate {
  return {
    userId: String(raw.userId ?? raw.id ?? ''),
    realName: String(raw.realName ?? raw.displayName ?? raw.name ?? ''),
    username: String(raw.username ?? ''),
    departmentName: String(raw.departmentName ?? raw.department ?? ''),
    roleName: String(raw.roleName ?? raw.role ?? ''),
  }
}

/** 规范用户搜索列表 */
export function normalizeUserSearchList(raw: unknown): UserSearchCandidate[] {
  return normalizeList(raw, normalizeUserSearchCandidate)
}

/** 将后端部门选项规范为 DepartmentOption */
export function normalizeDepartmentOption(raw: Record<string, unknown>): DepartmentOption {
  return {
    departmentId: String(raw.departmentId ?? raw.id ?? ''),
    departmentName: String(raw.departmentName ?? raw.name ?? raw.label ?? ''),
  }
}

/** 规范部门下拉列表 */
export function normalizeDepartmentOptionList(raw: unknown): DepartmentOption[] {
  return normalizeList(raw, normalizeDepartmentOption).filter((item) => item.departmentId)
}
