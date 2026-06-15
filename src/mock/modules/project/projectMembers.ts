import type {
  ProjectMember,
  ProjectMemberCandidate,
  ProjectMemberQueryParams,
  ProjectMemberRole,
} from '@/types/project'
import type { UserRecord } from '@/types/user'
import { MOCK_ALL_PROJECTS } from '@/mock/modules/project/projectList'
import { MOCK_ALL_USERS } from '@/mock/modules/system/userList'

interface ProjectMemberRecord extends ProjectMember {
  projectId: string
}

/** 各项目额外初始成员（userId 列表，不含负责人） */
const EXTRA_MEMBER_SEEDS: Record<string, string[]> = {
  'proj-001': ['user-004', 'user-005'],
  'proj-002': ['user-002', 'user-008'],
  'proj-003': ['user-003', 'user-011'],
  'proj-004': ['user-002', 'user-009'],
  'proj-005': ['user-010', 'user-012'],
}

/** 根据用户记录构建项目成员 */
function createMemberFromUser(
  projectId: string,
  user: UserRecord,
  projectRole: ProjectMemberRole,
  joinedAt: string,
): ProjectMemberRecord {
  return {
    memberId: `pm-${projectId}-${user.userId}`,
    projectId,
    userId: user.userId,
    realName: user.realName,
    username: user.username,
    departmentName: user.departmentName,
    roleName: user.roleName,
    projectRole,
    joinedAt,
  }
}

/** 按姓名在用户列表中查找 */
function findUserByRealName(realName: string): UserRecord | undefined {
  return MOCK_ALL_USERS.find((item) => item.realName === realName)
}

/** 构建全部项目的初始成员 mock */
function buildInitialProjectMembers(): ProjectMemberRecord[] {
  const members: ProjectMemberRecord[] = []

  for (const project of MOCK_ALL_PROJECTS) {
    const ownerUser =
      findUserByRealName(project.owner) ??
      MOCK_ALL_USERS.find((item) => item.status === 'enabled')

    if (!ownerUser) {
      continue
    }

    members.push(
      createMemberFromUser(project.projectId, ownerUser, 'owner', project.createdAt),
    )

    const extraUserIds = EXTRA_MEMBER_SEEDS[project.projectId] ?? []
    for (const userId of extraUserIds) {
      const user = MOCK_ALL_USERS.find((item) => item.userId === userId)
      if (!user || user.userId === ownerUser.userId) {
        continue
      }
      members.push(
        createMemberFromUser(
          project.projectId,
          user,
          'member',
          new Date(new Date(project.createdAt).getTime() + 86_400_000).toISOString(),
        ),
      )
    }
  }

  return members
}

/** 项目成员 mock 数据源（按项目隔离，支持增删改） */
export const MOCK_PROJECT_MEMBERS: ProjectMemberRecord[] = buildInitialProjectMembers()

/** 获取某项目全部成员（未分页） */
export function getMockProjectMembers(projectId: string): ProjectMemberRecord[] {
  return MOCK_PROJECT_MEMBERS.filter((item) => item.projectId === projectId)
}

/**
 * 分页获取项目成员
 * @param params - 项目 ID 与分页
 */
export function getMockProjectMemberPage(params: ProjectMemberQueryParams) {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 10

  const sorted = getMockProjectMembers(params.projectId).sort((a, b) => {
    if (a.projectRole === 'owner') return -1
    if (b.projectRole === 'owner') return 1
    return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()
  })

  const start = (page - 1) * pageSize
  const list = sorted.slice(start, start + pageSize).map(({ projectId: _pid, ...member }) => member)

  return {
    list,
    total: sorted.length,
    page,
    pageSize,
  }
}

/**
 * 搜索可添加的用户（排除已在项目中、已禁用的用户）
 * @param projectId - 项目 ID
 * @param keyword - 姓名关键词
 */
export function searchMockProjectMemberCandidates(
  projectId: string,
  keyword: string,
): ProjectMemberCandidate[] {
  const trimmed = keyword.trim()
  if (!trimmed) {
    return []
  }

  const existingUserIds = new Set(
    getMockProjectMembers(projectId).map((item) => item.userId),
  )

  return MOCK_ALL_USERS.filter(
    (item) =>
      item.status === 'enabled' &&
      !existingUserIds.has(item.userId) &&
      (item.realName.includes(trimmed) || item.username.includes(trimmed)),
  )
    .slice(0, 10)
    .map((item) => ({
      userId: item.userId,
      realName: item.realName,
      username: item.username,
      departmentName: item.departmentName,
      roleName: item.roleName,
    }))
}

/** mock：同步项目列表中的负责人姓名 */
function syncProjectOwnerName(projectId: string, ownerName: string): void {
  const project = MOCK_ALL_PROJECTS.find((item) => item.projectId === projectId)
  if (project) {
    project.owner = ownerName
  }
}

/**
 * mock：添加项目成员
 * @param projectId - 项目 ID
 * @param userId - 用户 ID
 */
export function mockAddProjectMember(projectId: string, userId: string): ProjectMember {
  const user = MOCK_ALL_USERS.find((item) => item.userId === userId)
  if (!user) {
    throw new Error('用户不存在')
  }
  if (user.status !== 'enabled') {
    throw new Error('该用户已禁用，无法添加')
  }
  if (getMockProjectMembers(projectId).some((item) => item.userId === userId)) {
    throw new Error('该用户已在项目中')
  }

  const member = createMemberFromUser(
    projectId,
    user,
    'member',
    new Date().toISOString(),
  )
  MOCK_PROJECT_MEMBERS.push(member)
  return member
}

/**
 * mock：更换项目负责人
 * @param projectId - 项目 ID
 * @param userId - 新负责人用户 ID
 */
export function mockTransferProjectOwner(projectId: string, userId: string): ProjectMember[] {
  const members = getMockProjectMembers(projectId)
  const target = members.find((item) => item.userId === userId)
  if (!target) {
    throw new Error('成员不存在')
  }
  if (target.projectRole === 'owner') {
    throw new Error('该成员已是负责人')
  }

  const currentOwner = members.find((item) => item.projectRole === 'owner')
  if (currentOwner) {
    currentOwner.projectRole = 'member'
  }
  target.projectRole = 'owner'
  syncProjectOwnerName(projectId, target.realName)

  return getMockProjectMembers(projectId).map(({ projectId: _pid, ...member }) => member)
}

/**
 * mock：移除项目成员（不可移除负责人）
 * @param projectId - 项目 ID
 * @param userId - 用户 ID
 */
export function mockRemoveProjectMember(projectId: string, userId: string): null {
  const index = MOCK_PROJECT_MEMBERS.findIndex(
    (item) => item.projectId === projectId && item.userId === userId,
  )
  if (index < 0) {
    throw new Error('成员不存在')
  }
  if (MOCK_PROJECT_MEMBERS[index].projectRole === 'owner') {
    throw new Error('不能移除项目负责人')
  }

  MOCK_PROJECT_MEMBERS.splice(index, 1)
  return null
}
