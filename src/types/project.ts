import type { PageParams } from '@/types/common'
import type { SourceIngestFormState } from '@/types/sourceIngest'
import type { UserSearchCandidate } from '@/types/user'
import type { Dayjs } from 'dayjs'

/** 项目状态（列表展示 3 种） */
export type ProjectStatus = 'in_progress' | 'completed' | 'failed'

/** 项目详情页 Tab key */
export type ProjectDetailTabKey = 'basic' | 'deliverables' | 'policy' | 'members' | 'tasks'

export interface Project {
  projectId: string
  projectName: string
  description: string
  owner: string
  /** 负责人用户 ID，下拉绑定与提交用 */
  ownerUserId: string
  department: string
  /** 所属部门 ID，下拉绑定与提交用 */
  departmentId: string
  status: ProjectStatus
  taskCount: number
  /** 最近扫描时间，ISO 8601；未扫描时为 null */
  lastScanAt: string | null
  createdAt: string
}

export interface ProjectListFilters {
  projectName: string
  owner: string
  status: ProjectStatus | ''
  createdAtRange: [Dayjs, Dayjs] | null
}

export interface ProjectQueryParams extends PageParams {
  projectName?: string
  owner?: string
  status?: ProjectStatus
  createdAtStart?: string
  createdAtEnd?: string
}

export interface CreateProjectParams {
  projectName: string
  description: string
  owner: string
  department: string
}

export type UpdateProjectParams = CreateProjectParams

/** 项目详情 · 基本信息 Tab 可编辑字段 */
export interface UpdateProjectBasicInfoParams {
  description: string
  ownerUserId: string
  departmentId: string
  status: ProjectStatus
}

export interface ProjectFormValues {
  projectName: string
  description: string
  owner: string
  department: string
}

/** 项目内角色：负责人 / 普通成员 */
export type ProjectMemberRole = 'owner' | 'member'

/** 项目成员列表项 */
export interface ProjectMember {
  memberId: string
  userId: string
  realName: string
  username: string
  departmentName: string
  roleName: string
  projectRole: ProjectMemberRole
  /** 加入项目时间，ISO 8601 */
  joinedAt: string
}

/** 添加成员弹窗：用户搜索候选项 */
export type ProjectMemberCandidate = UserSearchCandidate

export interface ProjectMemberQueryParams extends PageParams {
  projectId: string
}

export interface SearchProjectMemberCandidatesParams {
  projectId: string
  keyword: string
}

export interface AddProjectMemberParams {
  userId: string
}

export interface TransferProjectOwnerParams {
  userId: string
}

/** 交付物来源方式 */
export type DeliverableSourceMode = 'repo-pull' | 'upload-source-package' | 'upload-file'

/** 交付物类型 */
export type DeliverableType = 'source' | 'binary'

/** 项目交付物列表项 */
export interface ProjectDeliverable {
  deliverableId: string
  /** 交付物名称 */
  name: string
  sourceMode: DeliverableSourceMode
  deliverableType: DeliverableType
  /** 文件大小（字节） */
  sizeBytes: number
  md5: string
  uploaderName: string
  /** 上传时间，ISO 8601 */
  uploadedAt: string
  /** 三方仓库拉取时的源码仓库 URL */
  repositoryUrl?: string
  /** 上传类交付物的文件名（下载时使用） */
  fileName?: string
}

export interface ProjectDeliverableQueryParams extends PageParams {
  projectId: string
}

/** 交付物下载接口返回 */
export interface ProjectDeliverableDownloadResult {
  downloadUrl: string
  fileName: string
}

/** 上传二进制交付物请求 */
export interface UploadProjectBinaryDeliverableParams {
  file: File
}

/** 上传二进制交付物响应（后端异步解析，不立即返回列表项） */
export interface UploadProjectBinaryDeliverableResult {
  /** 后端解析任务 ID，联调后由接口返回 */
  parseTaskId?: string
}

/** 添加源码交付物请求 */
export interface AddProjectSourceDeliverableParams extends SourceIngestFormState {
  /** 扫描路径前缀，留空表示整包 */
  scanPathPrefix?: string
  /** 上传源码包模式下的压缩包 */
  packageFile?: File
}

/** 添加源码交付物响应（后端异步解析） */
export interface AddProjectSourceDeliverableResult {
  parseTaskId?: string
}
