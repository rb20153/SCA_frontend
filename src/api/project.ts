import type { ApiResponse, PageParams, PageResult } from '@/types/common'
import type { DetectTask } from '@/types/detect'
import type {
  AddProjectMemberParams,
  AddProjectSourceDeliverableParams,
  AddProjectSourceDeliverableResult,
  CreateProjectParams,
  Project,
  ProjectDeliverable,
  ProjectDeliverableDownloadResult,
  ProjectDeliverableQueryParams,
  UploadProjectBinaryDeliverableParams,
  UploadProjectBinaryDeliverableResult,
  ProjectMember,
  ProjectMemberCandidate,
  ProjectMemberQueryParams,
  ProjectQueryParams,
  TransferProjectOwnerParams,
  UpdateProjectBasicInfoParams,
  UpdateProjectParams,
} from '@/types/project'
import { getTaskList } from '@/api/detect'
import { MOCK_ALL_PROJECTS } from '@/mock/modules/project/projectList'
import { MOCK_ALL_DEPARTMENTS } from '@/mock/modules/system/departmentList'
import { findMockEnabledUserByRealName, findMockUserById } from '@/mock/modules/system/userList'
import {
  createMockDeliverableDownload,
  getMockProjectDeliverablePage,
  mockDeleteProjectDeliverable,
  mockUploadProjectBinaryDeliverable,
  mockAddProjectSourceDeliverable,
} from '@/mock/modules/project/projectDeliverables'
import {
  getMockProjectMemberPage,
  mockAddProjectMember,
  mockRemoveProjectMember,
  mockTransferProjectOwner,
  searchMockProjectMemberCandidates,
} from '@/mock/modules/project/projectMembers'

// TODO: replace with: import request from '@/utils/request'

const DEFAULT_PAGE_SIZE = 10

function parseDateTime(value: string): number {
  return new Date(value.replace(' ', 'T')).getTime()
}

/** mock 阶段按筛选条件过滤项目列表 */
function filterMockProjects(params: ProjectQueryParams): Project[] {
  let list = [...MOCK_ALL_PROJECTS]

  const projectName = params.projectName?.trim()
  if (projectName) {
    list = list.filter((item) => item.projectName.includes(projectName))
  }

  const owner = params.owner?.trim()
  if (owner) {
    list = list.filter((item) => item.owner.includes(owner))
  }

  if (params.status) {
    list = list.filter((item) => item.status === params.status)
  }

  if (params.createdAtStart) {
    const start = parseDateTime(params.createdAtStart)
    list = list.filter((item) => new Date(item.createdAt).getTime() >= start)
  }

  if (params.createdAtEnd) {
    const end = parseDateTime(params.createdAtEnd)
    list = list.filter((item) => new Date(item.createdAt).getTime() <= end)
  }

  return list.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

/**
 * 获取项目详情
 * @param projectId - 项目 ID
 */
export function getProjectDetail(projectId: string): Promise<ApiResponse<Project>> {
  const project = MOCK_ALL_PROJECTS.find((item) => item.projectId === projectId)
  if (!project) {
    return Promise.reject(new Error('项目不存在'))
  }

  // TODO: replace with → return request.get(`/api/projects/${projectId}`)
  return Promise.resolve({ code: 200, message: 'ok', data: project })
}

/**
 * 获取项目关联的检测任务列表（分页）
 * @param projectId - 项目 ID
 * @param params - 分页参数
 */
export function getProjectRelatedTasks(
  projectId: string,
  params: PageParams,
): Promise<ApiResponse<PageResult<DetectTask>>> {
  // TODO: replace with → return request.get(`/api/projects/${projectId}/tasks`, { params })
  return getTaskList({
    page: params.page,
    pageSize: params.pageSize,
    projectId,
  })
}

/**
 * 获取项目成员列表（分页）
 * @param params - 项目 ID 与分页参数
 */
export function getProjectMemberList(
  params: ProjectMemberQueryParams,
): Promise<ApiResponse<PageResult<ProjectMember>>> {
  // TODO: replace with → return request.get(`/api/projects/${params.projectId}/members`, { params })
  return Promise.resolve({
    code: 200,
    message: 'ok',
    data: getMockProjectMemberPage(params),
  })
}

/**
 * 搜索可添加的项目成员（输入停止后调用）
 * @param projectId - 项目 ID
 * @param keyword - 姓名或用户名关键词
 */
export function searchProjectMemberCandidates(
  projectId: string,
  keyword: string,
): Promise<ApiResponse<ProjectMemberCandidate[]>> {
  // TODO: replace with → return request.get(`/api/projects/${projectId}/member-candidates`, { params: { keyword } })
  return Promise.resolve({
    code: 200,
    message: 'ok',
    data: searchMockProjectMemberCandidates(projectId, keyword),
  })
}

/**
 * 添加项目成员
 * @param projectId - 项目 ID
 * @param data - 要添加的用户 ID
 */
export function addProjectMember(
  projectId: string,
  data: AddProjectMemberParams,
): Promise<ApiResponse<ProjectMember>> {
  try {
    const member = mockAddProjectMember(projectId, data.userId)
    // TODO: replace with → return request.post(`/api/projects/${projectId}/members`, data)
    return Promise.resolve({ code: 200, message: 'ok', data: member })
  } catch (error) {
    return Promise.reject(error instanceof Error ? error : new Error('添加失败'))
  }
}

/**
 * 更换项目负责人
 * @param projectId - 项目 ID
 * @param data - 新负责人用户 ID
 */
export function transferProjectOwner(
  projectId: string,
  data: TransferProjectOwnerParams,
): Promise<ApiResponse<ProjectMember[]>> {
  try {
    const list = mockTransferProjectOwner(projectId, data.userId)
    // TODO: replace with → return request.post(`/api/projects/${projectId}/transfer-owner`, data)
    return Promise.resolve({ code: 200, message: 'ok', data: list })
  } catch (error) {
    return Promise.reject(error instanceof Error ? error : new Error('更换失败'))
  }
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
  try {
    mockRemoveProjectMember(projectId, userId)
    // TODO: replace with → return request.delete(`/api/projects/${projectId}/members/${userId}`)
    return Promise.resolve({ code: 200, message: 'ok', data: null })
  } catch (error) {
    return Promise.reject(error instanceof Error ? error : new Error('移除失败'))
  }
}

/**
 * 获取项目交付物列表（分页）
 * @param params - 项目 ID 与分页参数
 */
export function getProjectDeliverableList(
  params: ProjectDeliverableQueryParams,
): Promise<ApiResponse<PageResult<ProjectDeliverable>>> {
  // TODO: replace with → return request.get(`/api/projects/${params.projectId}/deliverables`, { params })
  return Promise.resolve({
    code: 200,
    message: 'ok',
    data: getMockProjectDeliverablePage(params),
  })
}

/**
 * 获取交付物下载链接（点击下载时调用）
 * @param projectId - 项目 ID
 * @param deliverableId - 交付物 ID
 */
export function getProjectDeliverableDownload(
  projectId: string,
  deliverableId: string,
): Promise<ApiResponse<ProjectDeliverableDownloadResult>> {
  try {
    const data = createMockDeliverableDownload(projectId, deliverableId)
    // TODO: replace with → return request.post(`/api/projects/${projectId}/deliverables/${deliverableId}/download`)
    return Promise.resolve({ code: 200, message: 'ok', data })
  } catch (error) {
    return Promise.reject(error instanceof Error ? error : new Error('下载失败'))
  }
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
  try {
    mockDeleteProjectDeliverable(projectId, deliverableId)
    // TODO: replace with → return request.delete(`/api/projects/${projectId}/deliverables/${deliverableId}`)
    return Promise.resolve({ code: 200, message: 'ok', data: null })
  } catch (error) {
    return Promise.reject(error instanceof Error ? error : new Error('删除失败'))
  }
}

/**
 * 上传二进制交付物（后端异步解析，前端不刷新列表）
 * @param projectId - 项目 ID
 * @param params - 二进制文件
 */
export function uploadProjectBinaryDeliverable(
  projectId: string,
  params: UploadProjectBinaryDeliverableParams,
): Promise<ApiResponse<UploadProjectBinaryDeliverableResult>> {
  // TODO: replace with FormData → request.post(`/api/projects/${projectId}/deliverables/upload-binary`, formData)
  return Promise.resolve({
    code: 200,
    message: 'ok',
    data: mockUploadProjectBinaryDeliverable(projectId, params.file),
  })
}

/**
 * 添加源码交付物（仓库拉取或上传压缩包；后端异步解析，前端不刷新列表）
 * @param projectId - 项目 ID
 * @param params - 来源方式、凭据或压缩包、扫描路径前缀
 */
export function addProjectSourceDeliverable(
  projectId: string,
  params: AddProjectSourceDeliverableParams,
): Promise<ApiResponse<AddProjectSourceDeliverableResult>> {
  // TODO: replace with FormData / JSON → request.post(`/api/projects/${projectId}/deliverables/add-source`, ...)
  return Promise.resolve({
    code: 200,
    message: 'ok',
    data: mockAddProjectSourceDeliverable(projectId, params),
  })
}

/**
 * 获取项目列表（分页 + 筛选）
 * @param params - 分页与筛选参数
 */
export function getProjectList(
  params: ProjectQueryParams,
): Promise<ApiResponse<PageResult<Project>>> {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE

  const sorted = filterMockProjects(params)
  const start = (page - 1) * pageSize
  const list = sorted.slice(start, start + pageSize)

  return Promise.resolve({
    code: 200,
    message: 'ok',
    data: {
      list,
      total: sorted.length,
      page,
      pageSize,
    },
  })
}

/**
 * 新增项目
 * @param data - 项目名称、说明、负责人、所属部门
 */
export function createProject(data: CreateProjectParams): Promise<ApiResponse<Project>> {
  const projectName = data.projectName.trim()
  const owner = data.owner.trim()

  if (!projectName) {
    return Promise.reject(new Error('项目名称不能为空'))
  }
  if (!owner) {
    return Promise.reject(new Error('负责人不能为空'))
  }

  const departmentName = data.department.trim()
  const ownerUser = findMockEnabledUserByRealName(owner)
  const department = MOCK_ALL_DEPARTMENTS.find((item) => item.departmentName === departmentName)

  const project: Project = {
    projectId: `proj-${String(MOCK_ALL_PROJECTS.length + 1).padStart(3, '0')}`,
    projectName,
    description: data.description.trim(),
    owner,
    ownerUserId: ownerUser?.userId ?? '',
    department: departmentName,
    departmentId: department?.departmentId ?? '',
    status: 'in_progress',
    taskCount: 0,
    lastScanAt: null,
    createdAt: new Date().toISOString(),
  }

  MOCK_ALL_PROJECTS.unshift(project)

  // TODO: replace with → return request.post('/api/projects', data)
  return Promise.resolve({ code: 200, message: 'ok', data: project })
}

/**
 * 更新项目基本信息
 * @param projectId - 项目 ID
 * @param data - 可编辑字段
 */
export function updateProject(
  projectId: string,
  data: UpdateProjectParams,
): Promise<ApiResponse<Project>> {
  const index = MOCK_ALL_PROJECTS.findIndex((item) => item.projectId === projectId)
  if (index < 0) {
    return Promise.reject(new Error('项目不存在'))
  }

  const projectName = data.projectName.trim()
  const owner = data.owner.trim()

  if (!projectName) {
    return Promise.reject(new Error('项目名称不能为空'))
  }
  if (!owner) {
    return Promise.reject(new Error('负责人不能为空'))
  }

  const departmentName = data.department.trim()
  const ownerUser = findMockEnabledUserByRealName(owner)
  const department = MOCK_ALL_DEPARTMENTS.find((item) => item.departmentName === departmentName)

  const updated: Project = {
    ...MOCK_ALL_PROJECTS[index],
    projectName,
    description: data.description.trim(),
    owner,
    ownerUserId: ownerUser?.userId ?? MOCK_ALL_PROJECTS[index].ownerUserId,
    department: departmentName,
    departmentId: department?.departmentId ?? MOCK_ALL_PROJECTS[index].departmentId,
  }

  MOCK_ALL_PROJECTS[index] = updated

  // TODO: replace with → return request.put(`/api/projects/${projectId}`, data)
  return Promise.resolve({ code: 200, message: 'ok', data: updated })
}

/**
 * 更新项目详情 · 基本信息 Tab（不含项目名称）
 * @param projectId - 项目 ID
 * @param data - 说明、负责人、部门、状态
 */
export function updateProjectBasicInfo(
  projectId: string,
  data: UpdateProjectBasicInfoParams,
): Promise<ApiResponse<Project>> {
  const index = MOCK_ALL_PROJECTS.findIndex((item) => item.projectId === projectId)
  if (index < 0) {
    return Promise.reject(new Error('项目不存在'))
  }

  const ownerUser = findMockUserById(data.ownerUserId)
  if (!ownerUser || ownerUser.status !== 'enabled') {
    return Promise.reject(new Error('请选择有效的负责人'))
  }

  const department = MOCK_ALL_DEPARTMENTS.find((item) => item.departmentId === data.departmentId)
  if (!department || department.status !== 'enabled') {
    return Promise.reject(new Error('请选择有效的所属部门'))
  }

  const updated: Project = {
    ...MOCK_ALL_PROJECTS[index],
    description: data.description.trim(),
    owner: ownerUser.realName,
    ownerUserId: ownerUser.userId,
    department: department.departmentName,
    departmentId: department.departmentId,
    status: data.status,
  }

  MOCK_ALL_PROJECTS[index] = updated

  // TODO: replace with → return request.put(`/api/projects/${projectId}/basic-info`, data)
  return Promise.resolve({ code: 200, message: 'ok', data: updated })
}

/**
 * 删除项目
 * @param projectId - 要删除的项目 ID
 */
export function deleteProject(projectId: string): Promise<ApiResponse<null>> {
  const index = MOCK_ALL_PROJECTS.findIndex((item) => item.projectId === projectId)
  if (index >= 0) {
    MOCK_ALL_PROJECTS.splice(index, 1)
  }

  // TODO: replace with → return request.delete(`/api/projects/${projectId}`)
  return Promise.resolve({ code: 200, message: 'ok', data: null })
}
