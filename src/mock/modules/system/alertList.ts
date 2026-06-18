import type {
  AlertDetail,
  AlertDisposition,
  AlertLevel,
  AlertListItem,
  AlertQueryParams,
  AlertQueueStatus,
} from '@/types/system'
import { ALERT_DISPOSITION } from '@/types/system'
import { registerMockAlertTimeline, appendMockAlertTimelineEntry } from '@/mock/modules/system/alertTimeline'
import dayjs from 'dayjs'

interface AlertSeed {
  level: AlertLevel
  title: string
  sourceModule: string
  hoursAgo: number
  triggerRule: string
  content: string
  relatedTask?: AlertDetail['relatedTask']
  relatedProject?: AlertDetail['relatedProject']
  suggestions: string[]
  handlerName?: string
  handledHoursAgo?: number
  disposition?: AlertDisposition
}

const PENDING_SEEDS: AlertSeed[] = [
  {
    level: 'critical',
    title: '扫描任务失败',
    sourceModule: '检测引擎',
    hoursAgo: 2,
    triggerRule: 'SCAN_ENGINE_DOWN',
    content:
      '检测引擎在指纹阶段连接上游服务失败（10.0.0.21:9200），重试 3 次后任务中止。',
    relatedTask: {
      taskId: 'task-001',
      taskName: '全量扫描-001',
      taskType: 'autonomy',
    },
    relatedProject: {
      projectId: 'proj-001',
      projectName: '飞控仿真V2',
    },
    suggestions: [
      '检查指纹服务节点 10.0.0.21 进程与端口 9200',
      '确认知识库基线 v2026Q1-main 与任务绑定一致',
      '可从检查点恢复：task-20260519-001.ckpt',
    ],
  },
  {
    level: 'important',
    title: '知识库基线不一致',
    sourceModule: '知识库',
    hoursAgo: 3,
    triggerRule: 'KB_BASELINE_MISMATCH',
    content: '项目绑定的知识库基线版本与当前 OpenFOAM 最新快照不一致，可能影响自主率比对结果。',
    relatedProject: {
      projectId: 'proj-002',
      projectName: '结构分析平台',
    },
    suggestions: [
      '核对项目策略中绑定的知识库版本',
      '在版本管理页执行获取更新或确认基线',
    ],
  },
  {
    level: 'normal',
    title: 'Worker 内存使用率 > 90%',
    sourceModule: '资源监控',
    hoursAgo: 26,
    triggerRule: 'WORKER_MEM_HIGH',
    content: 'Worker-2 节点内存占用持续 15 分钟超过 90%，当前运行任务数 3。',
    suggestions: [
      '观察是否为大文件扫描导致，必要时迁移任务',
      '检查 Worker 节点 swap 与 JVM/进程限制配置',
    ],
  },
  {
    level: 'important',
    title: '漏洞库同步延迟',
    sourceModule: '知识库',
    hoursAgo: 5,
    triggerRule: 'VULN_SYNC_DELAY',
    content: 'GitHub Advisory 来源已超过 72 小时未成功同步，开源风险检测可能缺少最新公告。',
    suggestions: ['在漏洞知识库页触发立即同步', '检查外网代理与白名单配置'],
  },
  {
    level: 'normal',
    title: '报告生成队列积压',
    sourceModule: '报告服务',
    hoursAgo: 8,
    triggerRule: 'REPORT_QUEUE_BACKLOG',
    content: '待生成报告任务 6 个，预计最长等待 25 分钟。',
    suggestions: ['错峰生成大项目报告', '检查报告服务 worker 数量'],
  },
  {
    level: 'critical',
    title: '检测任务磁盘空间不足',
    sourceModule: '检测引擎',
    hoursAgo: 1,
    triggerRule: 'SCAN_DISK_LOW',
    content: '检测引擎临时目录剩余空间低于 5%，已暂停新任务调度。',
    relatedTask: {
      taskId: 'task-007',
      taskName: '全量扫描-007',
      taskType: 'autonomy',
    },
    suggestions: ['清理临时扫描目录', '扩容检测引擎数据盘'],
  },
]

const HANDLED_SEEDS: AlertSeed[] = [
  {
    level: 'important',
    title: '规则冲突需人工复核',
    sourceModule: '策略引擎',
    hoursAgo: 48,
    handledHoursAgo: 4,
    handlerName: '张三',
    disposition: ALERT_DISPOSITION.TransferReview,
    triggerRule: 'POLICY_RULE_CONFLICT',
    content: '策略「默认自主率阈值」与项目覆盖项存在互斥规则，自动合并失败。',
    suggestions: ['在策略编辑器中调整互斥项优先级', '发布前走审批流复核'],
  },
  {
    level: 'normal',
    title: '登录失败次数异常',
    sourceModule: '系统安全',
    hoursAgo: 72,
    handledHoursAgo: 6,
    handlerName: '李四',
    triggerRule: 'AUTH_BRUTE_FORCE',
    content: '同一 IP 在 10 分钟内登录失败 12 次，已触发临时封禁。',
    suggestions: ['确认是否为误操作', '必要时调整账号锁定策略'],
  },
  {
    level: 'critical',
    title: '指纹索引服务重启',
    sourceModule: '检测引擎',
    hoursAgo: 96,
    handledHoursAgo: 95,
    handlerName: '王五',
    triggerRule: 'FP_INDEX_RESTART',
    content: '指纹索引服务异常退出后已自动拉起，期间 2 个任务短暂排队。',
    relatedTask: {
      taskId: 'task-003',
      taskName: '开源风险-003',
      taskType: 'open-source-risk',
    },
    suggestions: ['查看服务重启日志', '确认索引文件完整性'],
  },
]

function buildAlertsFromSeeds(
  seeds: AlertSeed[],
  status: AlertQueueStatus,
  extraCount: number,
): AlertListItem[] {
  const base = dayjs()
  const items: AlertListItem[] = seeds.map((seed, index) => {
    const occurredAt = base.subtract(seed.hoursAgo, 'hour').toISOString()
    const alertId = `alert-${status}-${String(index + 1).padStart(3, '0')}`

    const item: AlertListItem = {
      alertId,
      level: seed.level,
      title: seed.title,
      sourceModule: seed.sourceModule,
      occurredAt,
      status: status === 'pending' ? 'pending' : 'handled',
      isRead: status === 'pending' ? index >= 2 : undefined,
    }

    if (status === 'handled') {
      item.handledAt = base
        .subtract(seed.handledHoursAgo ?? seed.hoursAgo - 1, 'hour')
        .toISOString()
      item.handlerName = seed.handlerName ?? '运维值班'
      item.disposition = seed.disposition ?? ALERT_DISPOSITION.TransferReview
    }

    return item
  })

  const levels: AlertLevel[] = ['critical', 'important', 'normal']
  const modules = ['检测引擎', '知识库', '资源监控', '策略引擎', '报告服务']

  for (let i = 0; i < extraCount; i += 1) {
    const seq = seeds.length + i + 1
    const level = levels[i % levels.length]
    const occurredAt = base.subtract(12 + i * 6, 'hour').toISOString()
    const alertId = `alert-${status}-${String(seq).padStart(3, '0')}`

    const item: AlertListItem = {
      alertId,
      level,
      title: `${modules[i % modules.length]}例行巡检告警-${seq}`,
      sourceModule: modules[i % modules.length],
      occurredAt,
      status: status === 'pending' ? 'pending' : 'handled',
      isRead: status === 'pending' ? true : undefined,
    }

    if (status === 'handled') {
      item.handledAt = base.subtract(10 + i * 5, 'hour').toISOString()
      item.handlerName = ['张三', '李四', '王五', '赵六'][i % 4]
      item.disposition = ALERT_DISPOSITION.ManualFix
    }

    items.push(item)
  }

  return items.sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  )
}

const MOCK_PENDING_ALERTS = buildAlertsFromSeeds(PENDING_SEEDS, 'pending', 12)
const MOCK_HANDLED_ALERTS = buildAlertsFromSeeds(HANDLED_SEEDS, 'handled', 9)

type AlertListMutation =
  | { type: 'update-pending'; index: number; item: AlertListItem }
  | { type: 'move-to-handled'; pendingIndex: number; handledItem: AlertListItem }

/** mock 阶段就地更新未处理/已处理队列（处置提交后） */
export function mutateMockAlertLists(mutation: AlertListMutation) {
  if (mutation.type === 'update-pending') {
    MOCK_PENDING_ALERTS[mutation.index] = mutation.item
    return
  }
  MOCK_PENDING_ALERTS.splice(mutation.pendingIndex, 1)
  MOCK_HANDLED_ALERTS.unshift(mutation.handledItem)
}

const ALERT_DETAIL_BY_ID = new Map<string, AlertDetail>()

function registerDetailFromSeed(
  alertId: string,
  seed: AlertSeed,
  occurredAt: string,
  status: AlertQueueStatus,
) {
  ALERT_DETAIL_BY_ID.set(alertId, {
    alertId,
    level: seed.level,
    title: seed.title,
    triggerRule: seed.triggerRule,
    occurredAt,
    status: status === 'pending' ? 'pending' : 'handled',
    content: seed.content,
    relatedTask: seed.relatedTask,
    relatedProject: seed.relatedProject,
    suggestions: seed.suggestions,
    handledAt:
      status === 'handled'
        ? dayjs()
            .subtract(seed.handledHoursAgo ?? seed.hoursAgo - 1, 'hour')
            .toISOString()
        : undefined,
    handlerName: status === 'handled' ? seed.handlerName : undefined,
  })
}

PENDING_SEEDS.forEach((seed, index) => {
  const alertId = `alert-pending-${String(index + 1).padStart(3, '0')}`
  registerDetailFromSeed(
    alertId,
    seed,
    dayjs().subtract(seed.hoursAgo, 'hour').toISOString(),
    'pending',
  )
})

HANDLED_SEEDS.forEach((seed, index) => {
  const alertId = `alert-handled-${String(index + 1).padStart(3, '0')}`
  const occurredAt = dayjs().subtract(seed.hoursAgo, 'hour').toISOString()
  registerDetailFromSeed(alertId, seed, occurredAt, 'handled')
  registerMockAlertTimeline(
    alertId,
    seed.title,
    seed.handlerName ?? '运维值班',
    seed.triggerRule,
    seed.disposition ?? ALERT_DISPOSITION.TransferReview,
  )
  if (seed.disposition === ALERT_DISPOSITION.TransferReview) {
    appendMockAlertTimelineEntry(
      alertId,
      dayjs().subtract(seed.handledHoursAgo ?? 4, 'hour').format('YYYY-MM-DD HH:mm'),
      '已向检测工程师王五发送站内消息，待进一步排查',
    )
  }
})

/** 获取指定队列状态的全量 mock 告警 */
export function getMockAlertsByStatus(status: AlertQueueStatus): AlertListItem[] {
  return status === 'pending' ? [...MOCK_PENDING_ALERTS] : [...MOCK_HANDLED_ALERTS]
}

/** mock 阶段按条件过滤并分页告警列表 */
export function filterMockAlertList(params: AlertQueryParams): AlertListItem[] {
  let list = getMockAlertsByStatus(params.status)

  if (params.level) {
    list = list.filter((item) => item.level === params.level)
  }

  if (params.occurredDate) {
    list = list.filter((item) => {
      const timeKey =
        params.status === 'handled' && item.handledAt
          ? item.handledAt.slice(0, 10)
          : item.occurredAt.slice(0, 10)
      return timeKey === params.occurredDate
    })
  }

  if (params.status === 'pending' && params.readStatus) {
    if (params.readStatus === 'unread') {
      list = list.filter((item) => !item.isRead)
    } else if (params.readStatus === 'read') {
      list = list.filter((item) => item.isRead)
    }
  }

  if (params.status === 'handled') {
    return list.sort(
      (a, b) =>
        new Date(b.handledAt ?? b.occurredAt).getTime() -
        new Date(a.handledAt ?? a.occurredAt).getTime(),
    )
  }

  return list.sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  )
}

/** 获取告警详情 mock；未知 ID 时基于列表项生成通用详情 */
export function getMockAlertDetail(alertId: string): AlertDetail | null {
  const cached = ALERT_DETAIL_BY_ID.get(alertId)
  if (cached) return cached

  const found = [...MOCK_PENDING_ALERTS, ...MOCK_HANDLED_ALERTS].find(
    (item) => item.alertId === alertId,
  )
  if (!found) return null

  return {
    alertId: found.alertId,
    level: found.level,
    title: found.title,
    triggerRule: 'GENERIC_ALERT',
    occurredAt: found.occurredAt,
    status: found.status,
    content: `${found.title}：系统检测到异常，请结合来源模块「${found.sourceModule}」进一步排查。`,
    suggestions: ['查看相关模块运行日志', '确认近期配置或数据是否有变更'],
    handledAt: found.handledAt,
    handlerName: found.handlerName,
  }
}
