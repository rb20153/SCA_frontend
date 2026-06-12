import type { PageResult } from '@/types/common'
import type {
  SiteMessage,
  SiteMessageListQuery,
  UpdateSiteMessageReadParams,
} from '@/types/siteMessage'

const SITE_MESSAGE_SEEDS: SiteMessage[] = [
  {
    messageId: 'msg-001',
    type: 'task_notice',
    title: '全量扫描-006 已完成',
    summary: '项目「飞控仿真V2」自主率 87.6%，可查看检测结果。',
    content:
      '项目「飞控仿真V2」检测任务已完成。总体自主率 87.6%，风险自主率 81.4%，问题文件 18 个。您可前往检测结果页查看证据链与性能统计。',
    recipientUserId: 'user-001',
    recipientUsername: 'admin',
    createdAt: '2026-06-11T14:20:08+08:00',
    read: false,
    action: {
      type: 'view_task_result',
      label: '查看结果',
      taskType: 'autonomy',
      taskId: 'task-006',
    },
  },
  {
    messageId: 'msg-002',
    type: 'approval_reminder',
    title: '策略 v2.4.0 待您审批',
    summary: 'engineer 提交了「航空软件标准策略」发布申请，涉及阈值与导出审批变更。',
    content:
      '策略「航空软件标准策略」版本 v2.4.0 已提交发布审批，请尽快在版本与审批页完成审核。',
    recipientUserId: 'user-001',
    recipientUsername: 'admin',
    createdAt: '2026-06-10T16:05:00+08:00',
    read: false,
    action: {
      type: 'go_approval',
      label: '去审批',
      policyId: 'policy-001',
    },
  },
  {
    messageId: 'msg-003',
    type: 'alert_notice',
    title: '扫描任务失败 · 需关注',
    summary: '任务「全量扫描-001」指纹服务连接失败，已生成紧急告警。',
    content: '检测引擎在指纹阶段连接上游服务失败，重试 3 次后任务中止，请前往告警中心处理。',
    recipientUserId: 'user-001',
    recipientUsername: 'admin',
    createdAt: '2026-06-09T10:25:00+08:00',
    read: false,
    action: {
      type: 'view_alert',
      label: '查看告警',
      alertId: 'alert-001',
    },
  },
  {
    messageId: 'msg-004',
    type: 'system_announcement',
    title: '知识库 2026Q2 季度更新计划已发布',
    summary: '本季度将同步 NVD/OSV 漏洞源并更新 OpenFOAM 基线，请提前安排窗口期。',
    content:
      '知识库管理团队已发布 2026Q2 季度更新计划，涵盖漏洞源同步与开源基线升级，请关注版本管理页进度。',
    recipientUserId: 'user-001',
    recipientUsername: 'admin',
    createdAt: '2026-06-08T09:00:00+08:00',
    read: true,
    action: {
      type: 'view_knowledge',
      label: '查看知识库',
    },
  },
  {
    messageId: 'msg-005',
    type: 'task_notice',
    title: 'SBOM 生成完成 · 结构分析平台',
    summary: '已生成 CycloneDX 格式 SBOM，共识别组件 42 个。',
    content: '开源风险检测任务已完成 SBOM 导出，可在任务结果页下载 CycloneDX 文件。',
    recipientUserId: 'user-001',
    recipientUsername: 'admin',
    createdAt: '2026-06-07T11:30:00+08:00',
    read: true,
    action: {
      type: 'view_task_result',
      label: '查看结果',
      taskType: 'open-source-risk',
      taskId: 'task-005',
    },
  },
  {
    messageId: 'msg-006',
    type: 'report_notice',
    title: '验收报告已生成',
    summary: '「飞控仿真V2」标准验收报告可下载，导出已按角色脱敏。',
    content: '报告中心已生成标准验收报告，您可前往报告管理页查看或下载。',
    recipientUserId: 'user-001',
    recipientUsername: 'admin',
    createdAt: '2026-06-06T17:45:00+08:00',
    read: true,
    action: {
      type: 'view_report',
      label: '查看报告',
      reportId: 'report-001',
    },
  },
  {
    messageId: 'msg-007',
    type: 'system_announcement',
    title: '平台维护通知',
    summary: '系统将于 2026-06-15 02:00–04:00 进行例行维护，期间检测任务可能短暂不可用。',
    content: '维护窗口内检测任务队列将暂停调度，已完成任务结果不受影响。',
    recipientUserId: 'user-001',
    recipientUsername: 'admin',
    createdAt: '2026-06-05T09:00:00+08:00',
    read: true,
    action: null,
  },
  {
    messageId: 'msg-008',
    type: 'approval_reminder',
    title: '策略变更待复核',
    summary: '「开源组件合规策略」v1.2.1 审批已通过，请确认是否同步到引用项目。',
    content: '审批流程已完成，请在策略治理页确认引用项目同步范围。',
    recipientUserId: 'user-001',
    recipientUsername: 'admin',
    createdAt: '2026-06-04T15:10:00+08:00',
    read: true,
    action: {
      type: 'go_approval',
      label: '去审批',
      policyId: 'policy-002',
    },
  },
  {
    messageId: 'msg-009',
    type: 'alert_notice',
    title: '高危漏洞告警摘要',
    summary: '知识库同步发现 3 条新增 Critical 漏洞，建议尽快评估受影响组件。',
    content: '漏洞知识库已更新，请在告警中心查看未处理条目并安排修复窗口。',
    recipientUserId: 'user-001',
    recipientUsername: 'admin',
    createdAt: '2026-06-03T08:40:00+08:00',
    read: true,
    action: {
      type: 'view_alert',
      label: '查看告警',
    },
  },
  {
    messageId: 'msg-010',
    type: 'report_notice',
    title: '管理摘要报告生成失败',
    summary: '「结构分析平台」报告导出失败：模板变量 project.owner 未解析。',
    content: '请检查报告模板配置后重新生成，或联系管理员处理。',
    recipientUserId: 'user-001',
    recipientUsername: 'admin',
    createdAt: '2026-06-02T13:20:00+08:00',
    read: false,
    action: {
      type: 'view_report',
      label: '查看报告',
    },
  },
  {
    messageId: 'msg-011',
    type: 'task_notice',
    title: '检测任务已完成',
    summary: '项目「飞控仿真V2」自主率检测任务已完成，可前往结果页查看。',
    content: '任务检测流程已结束，可查看自主率统计与指纹证据。',
    recipientUserId: 'user-002',
    recipientUsername: 'zhangsan',
    createdAt: '2026-06-01T14:30:00+08:00',
    read: false,
    action: {
      type: 'view_task_result',
      label: '查看结果',
      taskType: 'autonomy',
      taskId: 'task-002',
    },
  },
  {
    messageId: 'msg-012',
    type: 'task_notice',
    title: '增量扫描-003 已入队',
    summary: '项目「飞控仿真V2」增量扫描任务已进入队列，请关注进度通知。',
    content: '任务已提交调度，完成后将推送站内消息。',
    recipientUserId: 'user-001',
    recipientUsername: 'admin',
    createdAt: '2026-05-31T10:00:00+08:00',
    read: true,
    action: {
      type: 'view_task_result',
      label: '查看结果',
      taskType: 'autonomy',
      taskId: 'task-003',
    },
  },
  {
    messageId: 'msg-013',
    type: 'report_notice',
    title: '周报已自动归档',
    summary: '上周检测报告已归档至报告中心，可按项目筛选查看。',
    content: '系统自动归档完成，无需人工操作。',
    recipientUserId: 'user-001',
    recipientUsername: 'admin',
    createdAt: '2026-05-30T08:15:00+08:00',
    read: true,
    action: {
      type: 'view_report',
      label: '查看报告',
    },
  },
]

/** 运行时可追加的站内消息列表 */
export const MOCK_ALL_SITE_MESSAGES: SiteMessage[] = [...SITE_MESSAGE_SEEDS]

let nextMessageSeq = SITE_MESSAGE_SEEDS.length + 1

/**
 * 按查询条件筛选并分页站内消息（按时间倒序）
 * @param query - 接收人、类型、标题、已读状态、分页
 */
export function filterMockSiteMessageList(query: SiteMessageListQuery): PageResult<SiteMessage> {
  const { recipientUsername, type, title, readStatus = 'all', page, pageSize } = query

  let filtered = MOCK_ALL_SITE_MESSAGES.filter(
    (item) => item.recipientUsername === recipientUsername,
  )

  if (type) {
    filtered = filtered.filter((item) => item.type === type)
  }

  if (title?.trim()) {
    const keyword = title.trim().toLowerCase()
    filtered = filtered.filter(
      (item) =>
        item.title.toLowerCase().includes(keyword) ||
        item.summary.toLowerCase().includes(keyword),
    )
  }

  if (readStatus === 'read') {
    filtered = filtered.filter((item) => item.read)
  } else if (readStatus === 'unread') {
    filtered = filtered.filter((item) => !item.read)
  }

  filtered = [...filtered].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  const total = filtered.length
  const start = (page - 1) * pageSize
  const list = filtered.slice(start, start + pageSize)

  return { list, total, page, pageSize }
}

/**
 * 将指定用户全部消息标为已读
 * @param recipientUsername - 当前登录用户名
 */
export function markAllMockSiteMessagesRead(recipientUsername: string): number {
  let count = 0
  for (const item of MOCK_ALL_SITE_MESSAGES) {
    if (item.recipientUsername === recipientUsername && !item.read) {
      item.read = true
      count += 1
    }
  }
  return count
}

/**
 * 更新单条消息已读状态
 * @param params - 消息 ID 与目标已读状态
 */
export function updateMockSiteMessageRead(params: UpdateSiteMessageReadParams): boolean {
  const target = MOCK_ALL_SITE_MESSAGES.find((item) => item.messageId === params.messageId)
  if (!target) return false
  target.read = params.read
  return true
}

/**
 * 追加密码重置系统公告（管理员重置用户密码后通知该用户）
 * @param userId - 接收用户 ID
 * @param username - 接收用户名
 * @param tempPassword - 临时密码
 */
export function appendPasswordResetSiteMessage(
  userId: string,
  username: string,
  tempPassword: string,
): SiteMessage {
  const message: SiteMessage = {
    messageId: `msg-${String(nextMessageSeq).padStart(3, '0')}`,
    type: 'system_announcement',
    title: '密码已重置',
    summary: '您的账号密码已由管理员重置，请尽快修改密码。',
    content: `您的账号密码已由管理员重置。临时密码为：${tempPassword}，请尽快前往个人设置修改密码。`,
    recipientUserId: userId,
    recipientUsername: username,
    createdAt: new Date().toISOString(),
    read: false,
    action: {
      type: 'change_password',
      label: '去修改密码',
    },
  }
  nextMessageSeq += 1
  MOCK_ALL_SITE_MESSAGES.unshift(message)
  return message
}
