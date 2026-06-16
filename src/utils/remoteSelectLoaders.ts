import type { SelectOption } from '@/types/common'
import { getDetectTaskProjectOptions } from '@/api/detect'
import { getProfileDepartmentOptions } from '@/api/profile'
import { getEnabledDepartmentOptions } from '@/api/user'

/**
 * 加载启用部门下拉选项
 */
export async function loadEnabledDepartmentSelectOptions(): Promise<SelectOption[]> {
  const res = await getEnabledDepartmentOptions()
  return res.data.map((item) => ({
    label: item.departmentName,
    value: item.departmentId,
  }))
}

/**
 * 加载个人设置部门下拉选项
 */
export async function loadProfileDepartmentSelectOptions(): Promise<SelectOption[]> {
  const res = await getProfileDepartmentOptions()
  return res.data.map((item) => ({
    label: item.departmentName,
    value: item.departmentId,
  }))
}

/**
 * 加载检测任务关联项目下拉选项
 */
export async function loadDetectTaskProjectSelectOptions(): Promise<SelectOption[]> {
  const res = await getDetectTaskProjectOptions()
  return res.data.map((item) => ({
    label: item.projectName,
    value: item.projectId,
  }))
}

/**
 * 根据部门 ID 从选项列表解析部门名称
 * @param options - 下拉选项
 * @param departmentId - 部门 ID
 */
export function resolveDepartmentNameFromOptions(
  options: SelectOption[],
  departmentId: string,
): string | undefined {
  return options.find((item) => item.value === departmentId)?.label
}
