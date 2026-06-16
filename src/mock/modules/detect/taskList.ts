import type { DetectTask } from '@/types/detect'
import type { TaskSourceMode, TaskStatus, TaskType } from '@/types/common'

/** 检测任务 mock 种子：覆盖 6 种状态、两种类型、进度档位与来源/模式 */
interface TaskSeed {
  taskType: TaskType
  status: TaskStatus
  progress: number
  projectId: string
  projectName: string
  sourceMode: TaskSourceMode
  namePrefix: string
  elapsedMs?: number
  errorMsg?: string
  totalAutonomyRate?: number
}

const TASK_SEEDS: TaskSeed[] = [
  { taskType: 'autonomy', status: 'running', progress: 90, projectId: 'proj-001', projectName: '飞控仿真V2', sourceMode: 'full-scan', namePrefix: '全量扫描', elapsedMs: 8_100_000 },
  { taskType: 'autonomy', status: 'running', progress: 60, projectId: 'proj-001', projectName: '飞控仿真V2', sourceMode: 'incremental-scan', namePrefix: '增量扫描', elapsedMs: 2_520_000 },
  { taskType: 'open-source-risk', status: 'running', progress: 30, projectId: 'proj-001', projectName: '飞控仿真V2', sourceMode: 'project-scan', namePrefix: '开源风险', elapsedMs: 480_000 },
  { taskType: 'autonomy', status: 'queued', progress: 10, projectId: 'proj-001', projectName: '飞控仿真V2', sourceMode: 'quick-scan', namePrefix: '快速扫描' },
  { taskType: 'autonomy', status: 'success', progress: 100, projectId: 'proj-002', projectName: '结构分析平台', sourceMode: 'incremental-scan', namePrefix: '增量扫描', elapsedMs: 2_700_000, totalAutonomyRate: 87.6 },
  { taskType: 'open-source-risk', status: 'success', progress: 100, projectId: 'proj-002', projectName: '结构分析平台', sourceMode: 'import-sbom', namePrefix: '开源风险-SBOM', elapsedMs: 180_000 },
  { taskType: 'autonomy', status: 'failed', progress: 60, projectId: 'proj-003', projectName: '控制验证系统', sourceMode: 'full-scan', namePrefix: '全量扫描', elapsedMs: 720_000, errorMsg: '检测引擎连接超时' },
  { taskType: 'open-source-risk', status: 'failed', progress: 30, projectId: 'proj-003', projectName: '控制验证系统', sourceMode: 'project-scan', namePrefix: '开源风险', elapsedMs: 900_000, errorMsg: '漏洞库同步失败' },
  { taskType: 'autonomy', status: 'paused', progress: 90, projectId: 'proj-004', projectName: '仿真工具链', sourceMode: 'incremental-scan', namePrefix: '增量扫描', elapsedMs: 1_200_000 },
  { taskType: 'autonomy', status: 'terminated', progress: 30, projectId: 'proj-005', projectName: '柔性机构仿真链路', sourceMode: 'full-scan', namePrefix: '全量扫描', elapsedMs: 5_400_000 },
  { taskType: 'open-source-risk', status: 'terminated', progress: 60, projectId: 'proj-005', projectName: '柔性机构仿真链路', sourceMode: 'import-sbom', namePrefix: '开源风险', elapsedMs: 3_600_000 },
  { taskType: 'open-source-risk', status: 'queued', progress: 10, projectId: 'proj-002', projectName: '结构分析平台', sourceMode: 'project-scan', namePrefix: '开源风险' },
]

const MOCK_TASK_TOTAL = 52

const TERMINAL_STATUSES: TaskStatus[] = ['success', 'failed', 'terminated']

/**
 * 生成至少 50 条检测任务 mock，种子轮转并错开创建时间
 */
function buildMockDetectTasks(count: number): DetectTask[] {
  const baseTime = new Date('2026-06-09T12:00:00+08:00').getTime()

  return Array.from({ length: count }, (_, index) => {
    const seed = TASK_SEEDS[index % TASK_SEEDS.length]
    const seq = index + 1
    const createdAt = new Date(baseTime - index * 90 * 60_000).toISOString()

    const task: DetectTask = {
      taskId: `task-${String(seq).padStart(3, '0')}`,
      taskName: `${seed.namePrefix}-${String(seq).padStart(3, '0')}`,
      taskType: seed.taskType,
      status: seed.status,
      progress: seed.status === 'queued' ? 10 : seed.progress,
      projectId: seed.projectId,
      projectName: seed.projectName,
      sourceMode: seed.sourceMode,
      createdAt,
      retryCount: 3,
    }

    if (seed.elapsedMs !== undefined) {
      task.elapsedMs = seed.elapsedMs
    }
    if (seed.errorMsg) {
      task.errorMsg = seed.errorMsg
    }
    if (seed.totalAutonomyRate !== undefined) {
      task.totalAutonomyRate = seed.totalAutonomyRate
      task.netAutonomyRate = seed.totalAutonomyRate - 5
      task.riskAutonomyRate = seed.totalAutonomyRate - 8
    }
    if (seed.status !== 'queued') {
      task.startedAt = new Date(new Date(createdAt).getTime() + 60_000).toISOString()
    }
    if (TERMINAL_STATUSES.includes(seed.status)) {
      task.finishedAt = new Date(new Date(createdAt).getTime() + (seed.elapsedMs ?? 600_000)).toISOString()
    }

    if (seed.taskType === 'open-source-risk') {
      task.vulnDbVersion = `2026.${String((index % 6) + 1).padStart(2, '0')}`
    }

    return task
  })
}

/** 全量 mock 任务池（按 createdAt 从新到旧） */
export const MOCK_ALL_DETECT_TASKS: DetectTask[] = buildMockDetectTasks(MOCK_TASK_TOTAL)
// export const MOCK_ALL_DETECT_TASKS: DetectTask[] = []