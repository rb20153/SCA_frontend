import type {
  AiParseFallbackCompareItem,
  AiParseFallbackReason,
  AiParseTask,
  AiParseTaskStatus,
  CreateAiParseTaskParams,
} from '@/types/detect'
import { deriveAiParseObjectName } from '@/utils/aiParseDisplay'
import { getMockDetectTaskProjectOptions } from '@/mock/modules/detect/taskCreateOptions'

let parseTaskSeq = 100

/** 内存中的 AI 解析任务列表（mock 会话内持久） */
const aiParseTaskStore: AiParseTask[] = buildInitialAiParseTasks()

/** 构建初始 mock 解析历史 */
function buildInitialAiParseTasks(): AiParseTask[] {
  return [
    {
      parseTaskId: 'ai-parse-001',
      parseObjectName: 'OpenFOAM-dev.git',
      projectId: 'proj-001',
      projectName: '飞控仿真V2',
      createdAt: '2026-05-29T09:42:00+08:00',
      sourceMode: 'repo-pull',
      status: 'success',
      scanDepth: 3,
      resultSummary: '识别 4 类许可证',
      conflictCount: 2,
    },
    {
      parseTaskId: 'ai-parse-002',
      parseObjectName: 'component-mixed.git',
      projectId: 'proj-001',
      projectName: '飞控仿真V2',
      createdAt: '2026-05-29T11:05:00+08:00',
      sourceMode: 'repo-pull',
      status: 'running',
      scanDepth: 3,
      resultSummary: null,
      conflictCount: null,
    },
    {
      parseTaskId: 'ai-parse-003',
      parseObjectName: 'component-pack.7z',
      projectId: 'proj-002',
      projectName: '结构分析平台',
      createdAt: '2026-05-28T17:30:00+08:00',
      sourceMode: 'upload-source-package',
      status: 'failed',
      scanDepth: 2,
      resultSummary: null,
      conflictCount: null,
    },
    {
      parseTaskId: 'ai-parse-004',
      parseObjectName: 'solver-lib.tar.gz',
      projectId: 'proj-002',
      projectName: '结构分析平台',
      createdAt: '2026-05-27T14:18:00+08:00',
      sourceMode: 'upload-source-package',
      status: 'success',
      scanDepth: 2,
      resultSummary: '识别 2 类许可证',
      conflictCount: 1,
    },
  ]
}

/** 按项目 ID 解析项目名称 */
function resolveProjectName(projectId: string): string {
  const options = getMockDetectTaskProjectOptions()
  return options.find((item) => item.projectId === projectId)?.projectName ?? '未知项目'
}

export interface MockAiParseTaskQuery {
  sourceMode?: AiParseTask['sourceMode']
  status?: AiParseTaskStatus
  page?: number
  pageSize?: number
}

/**
 * mock：分页返回 AI 解析历史
 * @param params - 筛选与分页
 */
export function getMockAiParseTaskPage(params: MockAiParseTaskQuery) {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 10

  let list = [...aiParseTaskStore].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  if (params.sourceMode) {
    list = list.filter((item) => item.sourceMode === params.sourceMode)
  }
  if (params.status) {
    list = list.filter((item) => item.status === params.status)
  }

  const total = list.length
  const start = (page - 1) * pageSize

  return {
    list: list.slice(start, start + pageSize),
    total,
    page,
    pageSize,
  }
}

/**
 * mock：创建 AI 解析任务（立即进入进行中）
 * @param params - 创建参数
 */
export function mockCreateAiParseTask(params: CreateAiParseTaskParams): AiParseTask {
  parseTaskSeq += 1
  const task: AiParseTask = {
    parseTaskId: `ai-parse-${String(parseTaskSeq).padStart(3, '0')}`,
    parseObjectName: deriveAiParseObjectName(params),
    projectId: params.projectId,
    projectName: resolveProjectName(params.projectId),
    createdAt: new Date().toISOString(),
    sourceMode: params.sourceMode,
    status: 'running',
    scanDepth: params.scanDepth,
    resultSummary: null,
    conflictCount: null,
  }
  aiParseTaskStore.unshift(task)
  return task
}

/**
 * mock：获取规则回退对比项
 * @param parseTaskId - 解析任务 ID
 */
export function getMockAiParseFallbackCompare(
  parseTaskId: string,
): AiParseFallbackCompareItem[] {
  const task = aiParseTaskStore.find((item) => item.parseTaskId === parseTaskId)
  if (!task) {
    return []
  }

  return [
    {
      targetPath: 'custom-io/LICENSE',
      aiResult: 'Unknown',
      ruleResult: 'MIT-like',
    },
    {
      targetPath: 'vendor/readme.txt',
      aiResult: '—',
      ruleResult: 'Apache-2.0（关键词命中）',
    },
  ]
}

/**
 * mock：确认规则回退并重新解析（状态改回进行中）
 * @param parseTaskId - 解析任务 ID
 * @param _reason - 回退原因
 */
export function mockSubmitAiParseFallback(
  parseTaskId: string,
  _reason: AiParseFallbackReason,
): AiParseTask | undefined {
  const task = aiParseTaskStore.find((item) => item.parseTaskId === parseTaskId)
  if (!task || task.status !== 'failed') {
    return undefined
  }

  task.status = 'running'
  task.resultSummary = null
  task.conflictCount = null
  task.createdAt = new Date().toISOString()
  return { ...task }
}
