import type { ApiResponse, PageResult } from '@/types/common'
import type {
  CreateProjectParams,
  Project,
  ProjectQueryParams,
  UpdateProjectParams,
} from '@/types/project'
import { MOCK_ALL_PROJECTS } from '@/mock/modules/project/projectList'

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
  const project: Project = {
    projectId: `proj-${String(MOCK_ALL_PROJECTS.length + 1).padStart(3, '0')}`,
    projectName: data.projectName.trim(),
    description: data.description.trim(),
    owner: data.owner.trim(),
    department: data.department.trim(),
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

  const updated: Project = {
    ...MOCK_ALL_PROJECTS[index],
    projectName: data.projectName.trim(),
    description: data.description.trim(),
    owner: data.owner.trim(),
    department: data.department.trim(),
  }

  MOCK_ALL_PROJECTS[index] = updated

  // TODO: replace with → return request.put(`/api/projects/${projectId}`, data)
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
