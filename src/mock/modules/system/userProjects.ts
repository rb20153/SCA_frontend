import type { UserDetail, UserProjectRef } from '@/types/user'
import { MOCK_ALL_PROJECTS } from '@/mock/modules/project/projectList'
import { MOCK_ALL_USERS } from '@/mock/modules/system/userList'
import { USER_PROJECT_RELATIONS } from '@/mock/modules/system/userProjectRelations'

export { getMockOwnedProjectCount } from '@/mock/modules/system/userProjectRelations'

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
