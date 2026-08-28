import type { PageResult } from '@/types/common'
import type { DetectTask } from '@/types/detect'
import type {
  CreateProjectParams,
  Project,
  ProjectDeliverable,
  ProjectDeliverableCollectStatus,
  ProjectDeliverableDownloadResult,
  ProjectMember,
  ProjectMemberRole,
  ProjectPolicyBinding,
  ProjectQueryParams,
  ProjectStatus,
  UpdateProjectBasicInfoParams,
  UpdateProjectParams,
} from '@/types/project'
import { normalizeDetectTask } from '@/utils/detectAdapter'
import { normalizePolicyDetectParams } from '@/utils/policyAdapter'
import { normalizePageResult } from '@/utils/pageResultAdapter'
import { normalizeUserSearchCandidate } from '@/utils/userAdapter'
import { PROJECT_STATUS_LABEL } from '@/utils/projectDisplay'

/** 前端 ProjectStatus → 后端查询/存储用 status（后端当前返回中文） */
const PROJECT_STATUS_TO_API: Record<ProjectStatus, string> = {
  in_progress: PROJECT_STATUS_LABEL.in_progress,
  completed: PROJECT_STATUS_LABEL.completed,
  failed: PROJECT_STATUS_LABEL.failed,
}

/** 后端 status（中文或英文）→ 前端 ProjectStatus */
const PROJECT_STATUS_FROM_API: Record<string, ProjectStatus> = {
  [PROJECT_STATUS_LABEL.in_progress]: 'in_progress',
  [PROJECT_STATUS_LABEL.completed]: 'completed',
  [PROJECT_STATUS_LABEL.failed]: 'failed',
  in_progress: 'in_progress',
  inprogress: 'in_progress',
  active: 'in_progress',
  running: 'in_progress',
  completed: 'completed',
  done: 'completed',
  success: 'completed',
  failed: 'failed',
  error: 'failed',
}

/** 将后端项目 status 规范为前端枚举 */
function normalizeProjectStatus(raw: unknown): ProjectStatus {
  const text = String(raw ?? '').trim()
  if (PROJECT_STATUS_FROM_API[text]) {
    return PROJECT_STATUS_FROM_API[text]
  }
  const key = text.toLowerCase().replace(/-/g, '_')
  return PROJECT_STATUS_FROM_API[key] ?? 'in_progress'
}

/** 列表筛选：前端 status 枚举转为后端 query 参数（中文） */
export function projectQueryParamsToApi(params: ProjectQueryParams): Record<string, unknown> {
  const { status, ...rest } = params
  const apiParams: Record<string, unknown> = { ...rest }
  if (status) {
    apiParams.status = PROJECT_STATUS_TO_API[status]
  }
  return apiParams
}

/** 从后端项目对象解析部门名称与 ID（兼容 department 对象 / 多种字段名） */
function readProjectDepartmentFields(
  raw: Record<string, unknown>,
  projectId: string,
): {
  department: string
  departmentId: string
} {
  const deptRaw = raw.department
  const deptObj =
    deptRaw && typeof deptRaw === 'object' && !Array.isArray(deptRaw)
      ? (deptRaw as Record<string, unknown>)
      : null

  const department = String(
    (typeof deptRaw === 'string' ? deptRaw : '') ||
      raw.departmentName ||
      raw.deptName ||
      deptObj?.name ||
      deptObj?.departmentName ||
      deptObj?.deptName ||
      '',
  ).trim()

  let departmentId = String(
    raw.departmentId ||
      raw.deptId ||
      raw.dept_id ||
      deptObj?.departmentId ||
      deptObj?.deptId ||
      '',
  ).trim()

  // 后端偶发把 projectId 写入 departmentId / department，避免下拉展示 proj-xxx
  if (departmentId && projectId && departmentId === projectId) {
    departmentId = ''
  }
  if (department && projectId && department === projectId) {
    // department 名称位被污染时清空，由 fallback 或下拉 label 兜底
  }

  return { department, departmentId }
}

export interface NormalizeProjectOptions {
  /** 响应缺 departmentId 时保留提交前的部门 ID */
  fallbackDepartmentId?: string
  /** 响应缺 department 名称时保留提交前的部门名 */
  fallbackDepartment?: string
}

/** 将后端项目对象规范为前端 Project */
export function normalizeProject(
  raw: Record<string, unknown>,
  options?: NormalizeProjectOptions,
): Project {
  const projectId = String(raw.projectId ?? raw.id ?? '')
  let { department, departmentId } = readProjectDepartmentFields(raw, projectId)

  if (!departmentId && options?.fallbackDepartmentId) {
    departmentId = options.fallbackDepartmentId
  }
  if (!department && options?.fallbackDepartment) {
    department = options.fallbackDepartment
  }

  return {
    projectId,
    projectName: String(raw.projectName ?? raw.name ?? ''),
    description: String(raw.description ?? ''),
    owner: String(raw.owner ?? raw.ownerName ?? raw.ownerRealName ?? ''),
    ownerUserId: String(raw.ownerUserId ?? raw.ownerId ?? ''),
    department,
    departmentId,
    status: normalizeProjectStatus(raw.status),
    taskCount: Number(raw.taskCount ?? 0),
    lastScanAt:
      raw.lastScanAt === null || raw.lastScanAt === undefined || raw.lastScanAt === ''
        ? null
        : String(raw.lastScanAt),
    createdAt: String(raw.createdAt ?? ''),
  }
}

/** 规范项目列表分页结果 */
export function normalizeProjectPage(raw: unknown): PageResult<Project> {
  return normalizePageResult(raw, normalizeProject)
}

/**
 * 创建项目 · POST /api/projects 请求体（仅基本信息，策略/交付物走独立接口）
 */
export function createProjectParamsToApi(data: CreateProjectParams): Record<string, unknown> {
  return {
    projectName: data.projectName,
    name: data.projectName,
    description: data.description,
    owner: data.owner,
    ownerUserId: data.ownerUserId,
    department: data.department,
    departmentId: data.departmentId,
  }
}

/**
 * 列表编辑 / 详情基本信息 · PUT /api/projects/:id 请求体
 * 负责人与部门按名称提交；status 转为后端中文枚举（与列表筛选一致）
 */
export function updateProjectParamsToApi(data: UpdateProjectParams): Record<string, unknown> {
  const body: Record<string, unknown> = {
    description: data.description,
    owner: data.owner,
    department: data.department,
  }
  if (data.projectName !== undefined && data.projectName !== '') {
    body.projectName = data.projectName
    body.name = data.projectName
  }
  if (data.status) {
    body.status = PROJECT_STATUS_TO_API[data.status]
  }
  return body
}

/**
 * 详情 · 基本信息更新请求体（basic-info 专用，联调备用）
 * 后端按名称存储负责人与部门（ownerUserId/departmentId 不可靠），故同时提交名称与 ID；
 * status 用英文枚举（详情接口返回的也是英文，中文仅用于列表 query）
 */
export function projectBasicInfoParamsToApi(
  data: UpdateProjectBasicInfoParams,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    description: data.description,
    owner: data.owner,
    ownerUserId: data.ownerUserId,
    department: data.department,
    departmentId: data.departmentId,
    status: data.status,
  }
  if (data.projectName) {
    body.projectName = data.projectName
    body.name = data.projectName
  }
  return body
}

/** 将后端项目成员 role 规范为 owner / member */
function normalizeProjectMemberRole(raw: unknown): ProjectMemberRole {
  const text = String(raw ?? '').toLowerCase()
  return text === 'owner' ? 'owner' : 'member'
}

/** 将后端项目成员规范为 ProjectMember */
export function normalizeProjectMember(raw: Record<string, unknown>): ProjectMember {
  return {
    memberId: String(raw.memberId ?? raw.id ?? ''),
    userId: String(raw.userId ?? ''),
    realName: String(raw.realName ?? raw.name ?? ''),
    username: String(raw.username ?? ''),
    departmentName: String(raw.departmentName ?? raw.department ?? ''),
    roleName: String(raw.roleName ?? raw.role ?? ''),
    projectRole: normalizeProjectMemberRole(raw.projectRole ?? raw.project_role),
    joinedAt: String(raw.joinedAt ?? raw.createdAt ?? ''),
  }
}

/** 规范项目成员分页结果 */
export function normalizeProjectMemberPage(raw: unknown): PageResult<ProjectMember> {
  return normalizePageResult(raw, normalizeProjectMember)
}

/** 规范项目成员列表（更换负责人等接口直接返回数组） */
export function normalizeProjectMemberList(raw: unknown): ProjectMember[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => normalizeProjectMember(item as Record<string, unknown>))
}

/** 将后端交付物来源方式规范为前端枚举 */
function normalizeDeliverableSourceMode(raw: unknown): ProjectDeliverable['sourceMode'] {
  const text = String(raw ?? '').trim()
  if (text === 'repo-pull' || text === 'upload-source-package' || text === 'upload-file') {
    return text
  }
  if (text.includes('repo') || text.includes('pull')) return 'repo-pull'
  if (text.includes('package')) return 'upload-source-package'
  return 'upload-file'
}

/** 将后端交付物类型规范为 source / binary */
function normalizeDeliverableType(raw: unknown): ProjectDeliverable['deliverableType'] {
  const text = String(raw ?? '').toLowerCase()
  return text === 'binary' ? 'binary' : 'source'
}

/** 将后端 collect_status 规范为前端枚举 */
function normalizeDeliverableCollectStatus(
  raw: unknown,
): ProjectDeliverableCollectStatus | undefined {
  const text = String(raw ?? '').toLowerCase()
  if (
    text === 'pending' ||
    text === 'collecting' ||
    text === 'success' ||
    text === 'failed' ||
    text === 'deleted'
  ) {
    return text
  }
  return undefined
}

/** 判断交付物是否已被软删除（后端 DELETE 后仍可能出现在列表中） */
function isDeletedProjectDeliverable(raw: Record<string, unknown>): boolean {
  return normalizeDeliverableCollectStatus(raw.collectStatus ?? raw.collect_status) === 'deleted'
}

/** 将后端交付物规范为 ProjectDeliverable */
export function normalizeProjectDeliverable(raw: Record<string, unknown>): ProjectDeliverable {
  return {
    deliverableId: String(raw.deliverableId ?? raw.id ?? ''),
    name: String(raw.name ?? raw.fileName ?? ''),
    sourceMode: normalizeDeliverableSourceMode(raw.sourceMode ?? raw.source_mode ?? raw.source_type),
    deliverableType: normalizeDeliverableType(raw.deliverableType ?? raw.type),
    sizeBytes: Number(raw.sizeBytes ?? raw.size_bytes ?? raw.size ?? 0),
    md5: String(raw.md5 ?? raw.md5Hash ?? ''),
    uploaderName: String(raw.uploaderName ?? raw.uploader ?? raw.createdBy ?? raw.created_by ?? ''),
    uploadedAt: String(raw.uploadedAt ?? raw.created_at ?? raw.createdAt ?? ''),
    collectStatus: normalizeDeliverableCollectStatus(raw.collectStatus ?? raw.collect_status),
    repositoryUrl: raw.repositoryUrl
      ? String(raw.repositoryUrl)
      : raw.git_url
        ? String(raw.git_url)
        : undefined,
    fileName: raw.fileName ? String(raw.fileName) : undefined,
  }
}

/** 规范交付物分页结果（过滤 collect_status=deleted 的软删除项） */
export function normalizeProjectDeliverablePage(raw: unknown): PageResult<ProjectDeliverable> {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const listRaw = obj.list ?? obj.items ?? obj.records ?? []
  const pageItems = Array.isArray(listRaw)
    ? (listRaw as Record<string, unknown>[])
    : []

  const visibleItems = pageItems.filter((item) => !isDeletedProjectDeliverable(item))
  const deletedOnPage = pageItems.length - visibleItems.length
  const list = visibleItems.map((item) => normalizeProjectDeliverable(item))

  const backendTotal = Number(obj.total ?? list.length)

  return {
    list,
    total: Math.max(list.length, backendTotal - deletedOnPage),
    page: Number(obj.page ?? obj.current ?? 1),
    pageSize: Number(obj.pageSize ?? obj.size ?? (list.length || 10)),
  }
}

/** 规范交付物下载结果 */
export function normalizeProjectDeliverableDownload(
  raw: unknown,
): ProjectDeliverableDownloadResult {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  return {
    downloadUrl: String(obj.downloadUrl ?? obj.url ?? ''),
    fileName: String(obj.fileName ?? obj.name ?? 'download'),
  }
}

/** 从 policy-binding 响应中提取策略绑定对象（兼容嵌套 policy / 平铺字段） */
function unwrapProjectPolicyBindingRaw(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>

  const nested = obj.policy
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    const policyObj = nested as Record<string, unknown>
    return {
      ...policyObj,
      policyName: policyObj.policyName ?? obj.policyName ?? policyObj.name,
    }
  }

  return obj
}

/** 将后端策略绑定规范为 ProjectPolicyBinding；未绑定或缺 policyId 时返回 null */
export function normalizeProjectPolicyBinding(raw: unknown): ProjectPolicyBinding | null {
  const obj = unwrapProjectPolicyBindingRaw(raw)
  if (!obj) return null

  const policyId = String(obj.policyId ?? '').trim()
  if (!policyId || policyId.startsWith('proj-')) {
    return null
  }

  const params = normalizePolicyDetectParams(obj)
  const similarityThreshold = params?.similarityThreshold ?? Number(obj.similarityThreshold ?? 0)
  const minMatchLength =
    params?.minMatchLength ?? Number(obj.minMatchLength ?? obj.minMatchLines ?? 0)

  return {
    policyId,
    policyName: String(obj.policyName ?? obj.name ?? ''),
    similarityThreshold: Number.isNaN(similarityThreshold) ? 0 : similarityThreshold,
    minMatchLength: Number.isNaN(minMatchLength) ? 0 : minMatchLength,
    excludeDirectories: params?.excludeDirectories ?? [],
  }
}

/** 规范项目关联检测任务分页结果 */
export function normalizeProjectRelatedTaskPage(raw: unknown): PageResult<DetectTask> {
  return normalizePageResult(raw, (item) =>
    normalizeDetectTask(item as Record<string, unknown>),
  )
}

/** 规范项目成员搜索候选项列表 */
export function normalizeProjectMemberCandidateList(raw: unknown) {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => normalizeUserSearchCandidate(item as Record<string, unknown>))
}
