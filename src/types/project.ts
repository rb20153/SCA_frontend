import type { PageParams } from '@/types/common'
import type { Dayjs } from 'dayjs'

/** 项目状态（列表展示 3 种） */
export type ProjectStatus = 'in_progress' | 'completed' | 'failed'

export interface Project {
  projectId: string
  projectName: string
  description: string
  owner: string
  department: string
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

export interface ProjectFormValues {
  projectName: string
  description: string
  owner: string
  department: string
}
