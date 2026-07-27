import request from '@/utils/request'
import type { ApiResponse, PageParams, PageResult } from '@/types/common'
import {
  buildAddProjectSourceDeliverableFormData,
  buildUploadProjectBinaryDeliverableFormData,
} from '@/utils/formDataBuilders'
import type { DetectTask } from '@/types/detect'
import type {
  AddProjectMemberParams,
  AddProjectSourceDeliverableParams,
  AddProjectSourceDeliverableResult,
  CreateProjectWizardParams,
  Project,
  ProjectDeliverable,
  ProjectDeliverableDownloadResult,
  ProjectDeliverableQueryParams,
  UploadProjectBinaryDeliverableParams,
  UploadProjectBinaryDeliverableResult,
  ProjectMember,
  ProjectMemberCandidate,
  ProjectMemberQueryParams,
  ProjectPolicyBinding,
  ProjectPolicyBindingInput,
  ProjectQueryParams,
  TransferProjectOwnerParams,
  UpdateProjectBasicInfoParams,
  UpdateProjectParams,
} from '@/types/project'
import {
  normalizeProject,
  normalizeProjectDeliverableDownload,
  normalizeProjectDeliverablePage,
  normalizeProjectMember,
  normalizeProjectMemberCandidateList,
  normalizeProjectMemberList,
  normalizeProjectMemberPage,
  normalizeProjectPage,
  normalizeProjectPolicyBinding,
  normalizeProjectRelatedTaskPage,
  projectBasicInfoParamsToApi,
  projectQueryParamsToApi,
} from '@/utils/projectAdapter'

/**
 * 获取项目详情
 * @param projectId - 项目 ID
 */
export async function getProjectDetail(projectId: string): Promise<ApiResponse<Project>> {
  const res = await request.get<ApiResponse<unknown>>(`/api/projects/${projectId}`)
  return { ...res, data: normalizeProject(res.data as Record<string, unknown>) }
}

/**
 * 获取项目关联的检测任务列表（分页）
 * @param projectId - 项目 ID
 * @param params - 分页参数
 */
export async function getProjectRelatedTasks(
  projectId: string,
  params: PageParams,
): Promise<ApiResponse<PageResult<DetectTask>>> {
  const res = await request.get<ApiResponse<unknown>>(`/api/projects/${projectId}/tasks`, {
    params,
  })
  return { ...res, data: normalizeProjectRelatedTaskPage(res.data) }
}

/**
 * 获取项目成员列表（分页）
 * @param params - 项目 ID 与分页参数
 */
export async function getProjectMemberList(
  params: ProjectMemberQueryParams,
): Promise<ApiResponse<PageResult<ProjectMember>>> {
  const { projectId, ...query } = params
  const res = await request.get<ApiResponse<unknown>>(`/api/projects/${projectId}/members`, {
    params: query,
  })
  return { ...res, data: normalizeProjectMemberPage(res.data) }
}

/**
 * 搜索可添加的项目成员（输入停止后调用）
 * @param projectId - 项目 ID
 * @param keyword - 姓名或用户名关键词
 */
export async function searchProjectMemberCandidates(
  projectId: string,
  keyword: string,
): Promise<ApiResponse<ProjectMemberCandidate[]>> {
  const res = await request.get<ApiResponse<unknown>>(
    `/api/projects/${projectId}/member-candidates`,
    { params: { keyword } },
  )
  return { ...res, data: normalizeProjectMemberCandidateList(res.data) }
}

/**
 * 添加项目成员
 * @param projectId - 项目 ID
 * @param data - 要添加的用户 ID
 */
export async function addProjectMember(
  projectId: string,
  data: AddProjectMemberParams,
): Promise<ApiResponse<ProjectMember>> {
  const res = await request.post<ApiResponse<unknown>>(`/api/projects/${projectId}/members`, data)
  return {
    ...res,
    data: normalizeProjectMember(res.data as Record<string, unknown>),
  }
}

/**
 * 更换项目负责人
 * @param projectId - 项目 ID
 * @param data - 新负责人用户 ID
 */
export async function transferProjectOwner(
  projectId: string,
  data: TransferProjectOwnerParams,
): Promise<ApiResponse<ProjectMember[]>> {
  const res = await request.post<ApiResponse<unknown>>(
    `/api/projects/${projectId}/transfer-owner`,
    data,
  )
  return { ...res, data: normalizeProjectMemberList(res.data) }
}

/**
 * 移除项目成员
 * @param projectId - 项目 ID
 * @param userId - 要移除的用户 ID
 */
export function removeProjectMember(
  projectId: string,
  userId: string,
): Promise<ApiResponse<null>> {
  return request.delete(`/api/projects/${projectId}/members/${userId}`)
}

/**
 * 获取项目交付物列表（分页）
 * @param params - 项目 ID 与分页参数
 */
export async function getProjectDeliverableList(
  params: ProjectDeliverableQueryParams,
): Promise<ApiResponse<PageResult<ProjectDeliverable>>> {
  const { projectId, ...query } = params
  const res = await request.get<ApiResponse<unknown>>(
    `/api/projects/${projectId}/deliverables`,
    { params: query },
  )
  return { ...res, data: normalizeProjectDeliverablePage(res.data) }
}

/**
 * 获取交付物下载链接（点击下载时调用）
 * @param projectId - 项目 ID
 * @param deliverableId - 交付物 ID
 */
export async function getProjectDeliverableDownload(
  projectId: string,
  deliverableId: string,
): Promise<ApiResponse<ProjectDeliverableDownloadResult>> {
  const res = await request.post<ApiResponse<unknown>>(
    `/api/projects/${projectId}/deliverables/${deliverableId}/download`,
  )
  return { ...res, data: normalizeProjectDeliverableDownload(res.data) }
}

/**
 * 删除项目交付物
 * @param projectId - 项目 ID
 * @param deliverableId - 交付物 ID
 */
export function deleteProjectDeliverable(
  projectId: string,
  deliverableId: string,
): Promise<ApiResponse<null>> {
  return request.delete(`/api/projects/${projectId}/deliverables/${deliverableId}`)
}

/**
 * 上传二进制交付物（后端异步解析，前端不刷新列表）
 * @param projectId - 项目 ID
 * @param params - 二进制文件
 */
export async function uploadProjectBinaryDeliverable(
  projectId: string,
  params: UploadProjectBinaryDeliverableParams,
): Promise<ApiResponse<UploadProjectBinaryDeliverableResult>> {
  const formData = buildUploadProjectBinaryDeliverableFormData(params)
  return request.post(`/api/projects/${projectId}/deliverables/upload-binary`, formData)
}

/**
 * 添加源码交付物（仓库拉取或上传压缩包；后端异步解析，前端不刷新列表）
 * @param projectId - 项目 ID
 * @param params - 来源方式、凭据或压缩包、扫描路径前缀
 */
export async function addProjectSourceDeliverable(
  projectId: string,
  params: AddProjectSourceDeliverableParams,
): Promise<ApiResponse<AddProjectSourceDeliverableResult>> {
  const formData = buildAddProjectSourceDeliverableFormData(params)
  return request.post(`/api/projects/${projectId}/deliverables/add-source`, formData)
}

/**
 * 获取项目列表（分页 + 筛选）
 * @param params - 分页与筛选参数
 */
export async function getProjectList(
  params: ProjectQueryParams,
): Promise<ApiResponse<PageResult<Project>>> {
  const res = await request.get<ApiResponse<unknown>>('/api/projects', {
    params: projectQueryParamsToApi(params),
  })
  return { ...res, data: normalizeProjectPage(res.data) }
}

/**
 * 创建项目（向导：基本信息 + 策略绑定 + 交付物）
 * @param data - 完整创建参数
 */
export async function createProject(
  data: CreateProjectWizardParams,
): Promise<ApiResponse<Project>> {
  const res = await request.post<ApiResponse<unknown>>('/api/projects', data)
  return { ...res, data: normalizeProject(res.data as Record<string, unknown>) }
}

/**
 * 更新项目基本信息（列表编辑弹窗）
 * @param projectId - 项目 ID
 * @param data - 可编辑字段
 */
export async function updateProject(
  projectId: string,
  data: UpdateProjectParams,
): Promise<ApiResponse<Project>> {
  const res = await request.put<ApiResponse<unknown>>(`/api/projects/${projectId}`, data)
  return { ...res, data: normalizeProject(res.data as Record<string, unknown>) }
}

/**
 * 更新项目详情 · 基本信息 Tab（不含项目名称）
 * @param projectId - 项目 ID
 * @param data - 说明、负责人、部门、状态
 */
export async function updateProjectBasicInfo(
  projectId: string,
  data: UpdateProjectBasicInfoParams,
): Promise<ApiResponse<Project>> {
  const res = await request.put<ApiResponse<unknown>>(
    `/api/projects/${projectId}/basic-info`,
    projectBasicInfoParamsToApi(data),
  )
  const departmentLabel =
    typeof (res.data as Record<string, unknown> | null)?.department === 'string'
      ? String((res.data as Record<string, unknown>).department)
      : undefined
  return {
    ...res,
    data: normalizeProject(res.data as Record<string, unknown>, {
      fallbackDepartmentId: data.departmentId,
      fallbackDepartment: departmentLabel,
    }),
  }
}

/**
 * 获取项目已绑定的检测策略
 * @param projectId - 项目 ID
 */
export async function getProjectPolicyBinding(
  projectId: string,
): Promise<ApiResponse<ProjectPolicyBinding | null>> {
  const res = await request.get<ApiResponse<unknown>>(
    `/api/projects/${projectId}/policy-binding`,
    { params: { projectId }, data: { projectId } },
  )
  let binding = normalizeProjectPolicyBinding(res.data)
  if (binding) {
    return { ...res, data: binding }
  }

  // 部分后端仅在项目详情/创建响应中返回 policy，policy-binding GET 为空时兜底
  const detailRes = await request.get<ApiResponse<unknown>>(`/api/projects/${projectId}`)
  const detailRaw = detailRes.data as Record<string, unknown>
  binding =
    normalizeProjectPolicyBinding(detailRaw.policy) ??
    normalizeProjectPolicyBinding(detailRaw)

  return { ...res, data: binding }
}

/**
 * 更新项目检测策略绑定
 * @param projectId - 项目 ID
 * @param data - 策略 ID 与阈值等参数
 */
export async function updateProjectPolicyBinding(
  projectId: string,
  data: ProjectPolicyBindingInput,
): Promise<ApiResponse<ProjectPolicyBinding>> {
  const res = await request.put<ApiResponse<unknown>>(
    `/api/projects/${projectId}/policy-binding`,
    data,
  )
  const binding = normalizeProjectPolicyBinding(res.data)
  if (!binding) {
    return Promise.reject(new Error('策略绑定响应无效'))
  }
  return { ...res, data: binding }
}

/**
 * 删除项目
 * @param projectId - 要删除的项目 ID
 */
export function deleteProject(projectId: string): Promise<ApiResponse<null>> {
  return request.delete(`/api/projects/${projectId}`, { data: { projectId } })
}
