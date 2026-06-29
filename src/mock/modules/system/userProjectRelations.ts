/** 用户与项目关系 mock 种子（仅 ID，不依赖 projectList / userList，避免循环引用） */
export const USER_PROJECT_RELATIONS: Record<
  string,
  { joinedProjectIds: string[]; ownedProjectIds: string[] }
> = {
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

/**
 * 获取用户负责项目数量（删除前校验用）
 * @param userId - 用户 ID
 */
export function getMockOwnedProjectCount(userId: string): number {
  return USER_PROJECT_RELATIONS[userId]?.ownedProjectIds.length ?? 0
}
