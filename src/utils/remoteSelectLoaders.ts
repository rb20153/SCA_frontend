import type { SelectOption } from '@/types/common'
import { getDetectTaskProjectOptions } from '@/api/detect'
import { getKbProjectSelectOptions, getKbVersionSelectOptions } from '@/api/knowledge'
import { getPolicySelectOptions } from '@/api/policy'
import { getProfileDepartmentOptions } from '@/api/profile'
import { getEnabledDepartmentOptions, getEnabledUserOptions } from '@/api/user'

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
 * 加载启用用户下拉选项（负责人选择）
 */
export async function loadEnabledUserSelectOptions(): Promise<SelectOption[]> {
  const res = await getEnabledUserOptions()
  return res.data.map((item) => ({
    label: `${item.realName}（${item.departmentName} · ${item.roleName}）`,
    value: item.userId,
  }))
}

/**
 * 加载检测策略下拉选项
 */
export async function loadPolicySelectOptions(): Promise<SelectOption[]> {
  const res = await getPolicySelectOptions()
  return res.data.map((item) => ({
    label: item.policyName,
    value: item.policyId,
  }))
}

/**
 * 加载知识库项目下拉选项（项目目录页，非项目管理）
 */
export async function loadKbProjectSelectOptions(): Promise<SelectOption[]> {
  const res = await getKbProjectSelectOptions()
  return res.data.map((item) => ({
    label: item.projectName,
    value: item.kbProjectId,
  }))
}

/**
 * 加载指定知识库项目的版本下拉选项
 * @param kbProjectId - 知识库项目 ID
 */
export async function loadKbVersionSelectOptions(kbProjectId: string): Promise<SelectOption[]> {
  const res = await getKbVersionSelectOptions(kbProjectId)
  return res.data.map((item) => ({
    label: item.versionNo,
    value: item.versionId,
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
