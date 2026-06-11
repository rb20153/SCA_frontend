import type { ApiResponse, PageResult } from '@/types/common'
import type {
  DetectTask,
  CreateDetectTaskParams,
  DetectTaskProjectOption,
  TaskQueryParams,
  UpdateDetectTaskParams,
  TerminateTaskParams,
  VulnDbVersionOption,
} from '@/types/detect'
import { MOCK_ALL_DETECT_TASKS } from '@/mock/modules/detect/taskList'
import {
  getMockDetectTaskProjectOptions,
  getMockVulnDbVersionOptions,
  mockCreateDetectTask,
} from '@/mock/modules/detect/taskCreateOptions'

// TODO: replace with: import request from '@/utils/request'

const DEFAULT_PAGE_SIZE = 10

function findMockTask(taskId: string): DetectTask | undefined {
  return MOCK_ALL_DETECT_TASKS.find((t) => t.taskId === taskId)
}

function filterMockTasks(params: TaskQueryParams): DetectTask[] {
  let list = [...MOCK_ALL_DETECT_TASKS]

  const taskName = params.taskName?.trim()
  if (taskName) {
    list = list.filter((t) => t.taskName.includes(taskName))
  }

  if (params.taskType) {
    list = list.filter((t) => t.taskType === params.taskType)
  }

  const projectName = params.projectName?.trim()
  if (projectName) {
    list = list.filter((t) => t.projectName.includes(projectName))
  }

  if (params.projectId) {
    list = list.filter((t) => t.projectId === params.projectId)
  }

  if (params.status) {
    list = list.filter((t) => t.status === params.status)
  }

  return list.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

/**
 * mock 阶段分页：按筛选条件过滤后按 createdAt 倒序切片
 * 联调时改为 request.get('/api/detect/tasks', { params })
 */
export function getTaskList(params: TaskQueryParams): Promise<ApiResponse<PageResult<DetectTask>>> {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE

  const sorted = filterMockTasks(params)
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
 * 获取创建检测任务时的关联项目下拉选项
 */
export function getDetectTaskProjectOptions(): Promise<ApiResponse<DetectTaskProjectOption[]>> {
  // TODO: replace with → return request.get('/api/detect/tasks/project-options')
  return Promise.resolve({
    code: 200,
    message: 'ok',
    data: getMockDetectTaskProjectOptions(),
  })
}

/**
 * 获取开源风险检测可选的漏洞库版本列表
 */
export function getRiskDetectVulnDbVersions(): Promise<ApiResponse<VulnDbVersionOption[]>> {
  // TODO: replace with → return request.get('/api/detect/tasks/risk/vuln-db-versions')
  return Promise.resolve({
    code: 200,
    message: 'ok',
    data: getMockVulnDbVersionOptions(),
  })
}

/**
 * 创建检测任务（自主率 / 开源风险）
 * @param data - 按 taskType 区分的创建参数
 */
export function createDetectTask(data: CreateDetectTaskParams): Promise<ApiResponse<DetectTask>> {
  if (!data.taskName.trim()) {
    return Promise.reject(new Error('请输入任务名称'))
  }

  // TODO: replace with → return request.post('/api/detect/tasks', data)
  return Promise.resolve({
    code: 200,
    message: 'ok',
    data: mockCreateDetectTask(data),
  })
}

/** 获取任务详情 */
export function getTaskDetail(taskId: string): Promise<ApiResponse<DetectTask>> {
  // TODO: replace with → return request.get(`/api/detect/tasks/${taskId}`)
  const task = findMockTask(taskId) ?? MOCK_ALL_DETECT_TASKS[0]
  return Promise.resolve({ code: 200, message: 'ok', data: task })
}

/** 编辑检测任务（排队中 / 运行中的自主率任务） */
export function updateDetectTask(
  taskId: string,
  data: UpdateDetectTaskParams,
): Promise<ApiResponse<DetectTask>> {
  // TODO: replace with → return request.put(`/api/detect/tasks/${taskId}`, data)
  const task = findMockTask(taskId)
  if (!task) {
    return Promise.reject(new Error('任务不存在'))
  }
  task.taskName = data.taskName
  task.sourceMode = data.sourceMode
  task.retryCount = data.retryCount
  return Promise.resolve({ code: 200, message: '保存成功', data: { ...task } })
}

/** 删除任务 */
export function deleteTask(taskId: string): Promise<ApiResponse<null>> {
  // TODO: replace with → return request.delete(`/api/detect/tasks/${taskId}`)
  const idx = MOCK_ALL_DETECT_TASKS.findIndex((t) => t.taskId === taskId)
  if (idx >= 0) {
    MOCK_ALL_DETECT_TASKS.splice(idx, 1)
  }
  return Promise.resolve({ code: 200, message: '删除成功', data: null })
}

/** 暂停任务 */
export function pauseTask(taskId: string): Promise<ApiResponse<DetectTask>> {
  // TODO: replace with → return request.post(`/api/detect/tasks/${taskId}/pause`)
  const task = findMockTask(taskId)
  if (!task) {
    return Promise.reject(new Error('任务不存在'))
  }
  task.status = 'paused'
  return Promise.resolve({ code: 200, message: '已暂停', data: { ...task } })
}

/** 继续任务（从已暂停恢复为运行中） */
export function resumeTask(taskId: string): Promise<ApiResponse<DetectTask>> {
  // TODO: replace with → return request.post(`/api/detect/tasks/${taskId}/resume`)
  const task = findMockTask(taskId)
  if (!task) {
    return Promise.reject(new Error('任务不存在'))
  }
  task.status = 'running'
  return Promise.resolve({ code: 200, message: '已继续运行', data: { ...task } })
}

/** 终止任务 */
export function terminateTask(
  taskId: string,
  data: TerminateTaskParams,
): Promise<ApiResponse<DetectTask>> {
  // TODO: replace with → return request.post(`/api/detect/tasks/${taskId}/terminate`, data)
  const task = findMockTask(taskId)
  if (!task) {
    return Promise.reject(new Error('任务不存在'))
  }
  task.status = 'terminated'
  task.finishedAt = new Date().toISOString()
  task.errorMsg = data.reason
  return Promise.resolve({ code: 200, message: '已终止', data: { ...task } })
}
