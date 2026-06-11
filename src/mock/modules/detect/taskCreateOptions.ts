import type {
  CreateDetectTaskParams,
  DetectTaskProjectOption,
  DetectTask,
  VulnDbVersionOption,
} from '@/types/detect'
import { MOCK_ALL_PROJECTS } from '@/mock/modules/project/projectList'
import { MOCK_ALL_DETECT_TASKS } from '@/mock/modules/detect/taskList'

/** 漏洞库版本 mock（开源风险创建任务用） */
const MOCK_VULN_DB_VERSIONS: VulnDbVersionOption[] = [
  { version: '2026.05', label: '2026.05' },
  { version: '2026.04', label: '2026.04' },
  { version: '2026.03', label: '2026.03' },
]

/**
 * 获取检测任务创建弹窗的项目下拉 mock
 */
export function getMockDetectTaskProjectOptions(): DetectTaskProjectOption[] {
  return MOCK_ALL_PROJECTS.map((item) => ({
    projectId: item.projectId,
    projectName: item.projectName,
  }))
}

/**
 * 获取漏洞库版本下拉 mock
 */
export function getMockVulnDbVersionOptions(): VulnDbVersionOption[] {
  return MOCK_VULN_DB_VERSIONS.map((item) => ({ ...item }))
}

/**
 * mock 创建检测任务并写入任务池头部
 * @param params - 自主率或开源风险创建参数
 */
export function mockCreateDetectTask(params: CreateDetectTaskParams): DetectTask {
  const project =
    MOCK_ALL_PROJECTS.find((item) => item.projectId === params.projectId) ?? MOCK_ALL_PROJECTS[0]

  const seq = MOCK_ALL_DETECT_TASKS.length + 1
  const taskId = `task-${String(seq).padStart(3, '0')}`
  const createdAt = new Date().toISOString()

  if (params.taskType === 'autonomy') {
    const task: DetectTask = {
      taskId,
      taskName: params.taskName.trim(),
      taskType: 'autonomy',
      status: 'queued',
      progress: 10,
      projectId: project.projectId,
      projectName: project.projectName,
      sourceMode: params.scanMode,
      createdAt,
      retryCount: params.autoRetryEnabled ? params.retryCount ?? 3 : 0,
    }
    MOCK_ALL_DETECT_TASKS.unshift(task)
    return task
  }

  const task: DetectTask = {
    taskId,
    taskName: params.taskName.trim(),
    taskType: 'open-source-risk',
    status: 'queued',
    progress: 10,
    projectId: project.projectId,
    projectName: project.projectName,
    sourceMode: params.dataSource,
    createdAt,
  }
  MOCK_ALL_DETECT_TASKS.unshift(task)
  return task
}
