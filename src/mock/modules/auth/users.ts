import type { ApiResponse } from '@/types/common'
import type { UserInfo } from '@/stores/auth'

// ── 已注册用户名列表（用于注册时校验重复） ────────────────────────────────────
export const MOCK_REGISTERED_USERNAMES: string[] = [
  'admin',
  'analyst01',
  'auditor01',
  'viewer01',
]

// ── Mock 登录成功后的用户信息 ─────────────────────────────────────────────────
export const mockLoginRes: ApiResponse<{ token: string; userInfo: UserInfo }> = {
  code: 200,
  message: 'ok',
  data: {
    token: 'mock-token-admin',
    userInfo: {
      userId: 'u001',
      username: 'admin',
      realName: '管理员',
      role: 'admin',
      phone: '13800000001',
      department: '检测中心',
    },
  },
}

/** 刷新页面后凭 token 恢复当前登录用户（mock 阶段固定返回 admin） */
export const mockCurrentUserRes: ApiResponse<UserInfo> = {
  code: 200,
  message: 'ok',
  data: mockLoginRes.data.userInfo,
}

// ── Mock 用户列表（系统管理 > 用户列表页使用） ────────────────────────────────
export const mockUserList: ApiResponse<{ list: UserInfo[]; total: number }> = {
  code: 200,
  message: 'ok',
  data: {
    list: [
      {
        userId: 'u001',
        username: 'admin',
        realName: '管理员',
        role: 'admin',
        phone: '13800000001',
        department: '检测中心',
      },
      {
        userId: 'u002',
        username: 'analyst01',
        realName: '张分析员',
        role: 'analyst',
        phone: '13800000002',
        department: '研发部',
      },
      {
        userId: 'u003',
        username: 'auditor01',
        realName: '李审计员',
        role: 'auditor',
        phone: '13800000003',
        department: '合规部',
      },
      {
        userId: 'u004',
        username: 'viewer01',
        realName: '王只读',
        role: 'viewer',
        phone: '13800000004',
        department: '业务部',
      },
    ],
    total: 4,
  },
}
