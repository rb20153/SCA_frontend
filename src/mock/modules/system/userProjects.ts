import type { UserDetail, UserProjectRef } from '@/types/user'
import { MOCK_ALL_PROJECTS } from '@/mock/modules/project/projectList'
import { MOCK_ALL_USERS } from '@/mock/modules/system/userList'

interface UserProjectRelationSeed {
  joinedProjectIds: string[]
  ownedProjectIds: string[]
}

/** 用户与项目关系 mock（成员 / 负责人） */
const USER_PROJECT_RELATIONS: Record<string, UserProjectRelationSeed> = {
  'user-001': {
    joinedProjectIds: ['proj-001', 'proj-004', 'proj-007'],
    ownedProjectIds: [],
  },
  'user-002': {
    joinedProjectIds: ['proj-001', 'proj-005', 'proj-008'],
    ownedProjectIds: ['proj-001'],
  },
  'user-003': {
    joinedProjectIds: ['proj-002', 'proj-006'],
    ownedProjectIds: ['proj-002'],
  },
  'user-004': {
    joinedProjectIds: ['proj-003'],
    ownedProjectIds: ['proj-003'],
  },
  'user-005': {
    joinedProjectIds: ['proj-004', 'proj-009'],
    ownedProjectIds: ['proj-004'],
  },
  'user-006': {
    joinedProjectIds: ['proj-005'],
    ownedProjectIds: [],
  },
  'user-007': {
    joinedProjectIds: [],
    ownedProjectIds: [],
  },
  'user-008': {
    joinedProjectIds: ['proj-006', 'proj-010'],
    ownedProjectIds: ['proj-006'],
  },
  'user-009': {
    joinedProjectIds: ['proj-007'],
    ownedProjectIds: ['proj-007'],
  },
  'user-010': {
    joinedProjectIds: ['proj-008', 'proj-011'],
    ownedProjectIds: [],
  },
  'user-011': {
    joinedProjectIds: ['proj-001', 'proj-009', 'proj-012'],
    ownedProjectIds: [],
  },
  'user-012': {
    joinedProjectIds: ['proj-002'],
    ownedProjectIds: [],
  },
}

/** 将项目 ID 列表解析为展示用引用 */
function resolveProjectRefs(projectIds: string[]): UserProjectRef[] {
  return projectIds
    .map((projectId) => {
      const project = MOCK_ALL_PROJECTS.find((item) => item.projectId === projectId)
      if (!project) {
        return null
      }
      return {
        projectId: project.projectId,
        projectName: project.projectName,
      }
    })
    .filter((item): item is UserProjectRef => item !== null)
}

/**
 * 获取用户负责项目数量（删除前校验用）
 * @param userId - 用户 ID
 */
export function getMockOwnedProjectCount(userId: string): number {
  return USER_PROJECT_RELATIONS[userId]?.ownedProjectIds.length ?? 0
}

/**
 * 获取用户详情（含已加入 / 负责项目）
 * @param userId - 用户 ID
 */
export function getMockUserDetail(userId: string): UserDetail | null {
  const user = MOCK_ALL_USERS.find((item) => item.userId === userId)
  if (!user) {
    return null
  }

  const relation = USER_PROJECT_RELATIONS[userId] ?? {
    joinedProjectIds: [],
    ownedProjectIds: [],
  }

  return {
    ...user,
    ownedProjectCount: relation.ownedProjectIds.length,
    joinedProjects: resolveProjectRefs(relation.joinedProjectIds),
    ownedProjects: resolveProjectRefs(relation.ownedProjectIds),
  }
}
