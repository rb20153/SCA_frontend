import type { PageParams } from '@/types/common'
import type { Dayjs } from 'dayjs'

/** 用户账号状态 */
export type UserStatus = 'enabled' | 'disabled'

/** 启用用户下拉选项（负责人选择等） */
export interface UserOption {
  userId: string
  realName: string
  departmentName: string
  roleName: string
}

/** 用户搜索候选项（添加成员 / 选择负责人等） */
export interface UserSearchCandidate {
  userId: string
  realName: string
  username: string
  departmentName: string
  roleName: string
}

/** 用户关联项目摘要 */
export interface UserProjectRef {
  projectId: string
  projectName: string
}

/** 用户持久化字段（mock / 后端存储，不含负责项目数） */
export interface UserRecord {
  userId: string
  username: string
  realName: string
  departmentId: string
  departmentName: string
  roleId: string
  roleName: string
  phone: string
  status: UserStatus
  /** 创建时间，ISO 8601 */
  createdAt: string
  /** 最后登录时间；未登录为 null */
  lastLoginAt: string | null
}

/** 系统用户列表项 */
export interface SystemUser extends UserRecord {
  /** 作为负责人的项目数量（删除前校验） */
  ownedProjectCount: number
}

/** 用户详情（抽屉展示） */
export interface UserDetail extends SystemUser {
  /** 作为项目组成员加入的项目 */
  joinedProjects: UserProjectRef[]
  /** 作为负责人负责的项目 */
  ownedProjects: UserProjectRef[]
}

export interface ResetUserPasswordParams {
  userId: string
  username: string
  newPassword: string
}

export interface ResetUserPasswordResult {
  userId: string
  username: string
}

export interface DepartmentOption {
  departmentId: string
  departmentName: string
}

export interface RoleOption {
  roleId: string
  roleName: string
}

export interface UserListFilters {
  realName: string
  roleId: string
  departmentName: string
  createdAtRange: [Dayjs, Dayjs] | null
}

export interface UserQueryParams extends PageParams {
  realName?: string
  roleId?: string
  departmentName?: string
  createdAtStart?: string
  createdAtEnd?: string
}

export interface CreateUserParams {
  username: string
  realName: string
  password: string
  departmentId: string
  roleId: string
  phone: string
  status: UserStatus
}

export interface UpdateUserParams {
  realName: string
  departmentId: string
  roleId: string
  phone: string
  status: UserStatus
}

export interface UserFormValues {
  username: string
  realName: string
  password: string
  departmentId: string
  roleId: string
  phone: string
  status: UserStatus
}
