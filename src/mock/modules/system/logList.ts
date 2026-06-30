import type {
  LogDetail,
  LogExportParams,
  LogExportResult,
  LogListItem,
  LogQueryParams,
  LogResult,
} from '@/types/system'
import dayjs from 'dayjs'

interface LogSeed {
  traceId: string
  minutesAgo: number
  username: string
  module: string
  operation: string
  resourceObject: string
  ip: string
  result: LogResult
  relatedTaskId?: string
  auditConclusion: string
  timeline: LogDetail['timeline']
  rawLogExcerpt: string
}

const LOG_SEEDS: LogSeed[] = [
  {
    traceId: 'trace-20260519-0001',
    minutesAgo: 35,
    username: 'admin',
    module: '自主率检测',
    operation: '启动任务',
    resourceObject: '全量扫描-001',
    ip: '10.0.0.1',
    result: 'success',
    relatedTaskId: 'task-001',
    auditConclusion:
      '本次启动任务在权限校验、任务入队、Worker 领取与 checkpoint 保存链路均有记录，可追溯。',
    timeline: [
      { time: '10:00:12', message: 'UI: 点击「启动扫描」(task-add)' },
      { time: '10:00:12', message: 'API: /v1/tasks/start 200 OK (req-id=rq-81f2)' },
      { time: '10:00:13', message: 'MQ: topic=scan.start enqueue (msg-id=mq-0192)' },
      { time: '10:00:15', message: 'Worker: worker-2 claim task-20260519-001' },
      { time: '10:22:00', message: 'FP Service: index loaded 1.2M records' },
      { time: '10:23:12', message: 'Checkpoint: saved task-20260519-001.ckpt' },
    ],
    rawLogExcerpt: `[10:00:12] INFO authz pass user=admin
[10:00:12] INFO task start id=task-20260519-001
[10:00:13] INFO enqueue mq-0192
[10:00:15] INFO worker-2 claimed
[10:22:00] INFO fingerprint index loaded records=1203840
[10:23:12] INFO checkpoint saved path=/data/ckpt/task-20260519-001.ckpt`,
  },
  {
    traceId: 'trace-20260519-0002',
    minutesAgo: 28,
    username: 'engine',
    module: '检测引擎',
    operation: '上传交付物',
    resourceObject: 'src.zip',
    ip: '10.0.0.12',
    result: 'success',
    auditConclusion: '交付物上传、病毒扫描与元数据登记均成功，文件已关联项目飞控仿真V2。',
    timeline: [
      { time: '10:02:44', message: 'UI: 上传交付物 src.zip (48.2MB)' },
      { time: '10:02:46', message: 'API: /v1/artifacts/upload 200 OK' },
      { time: '10:02:50', message: 'AV Scan: clean sha256=9f3a...c21' },
      { time: '10:02:51', message: 'Storage: object stored bucket=sca-artifacts' },
    ],
    rawLogExcerpt: `[10:02:44] INFO upload begin user=engine file=src.zip
[10:02:46] INFO upload complete artifact_id=art-8821
[10:02:50] INFO av_scan status=clean
[10:02:51] INFO metadata saved project=proj-001`,
  },
  {
    traceId: 'trace-20260519-0042',
    minutesAgo: 18,
    username: 'worker-2',
    module: '检测引擎',
    operation: '扫描失败',
    resourceObject: 'task-20260519-001',
    ip: '10.0.0.12',
    result: 'failure',
    relatedTaskId: 'task-007',
    auditConclusion:
      '扫描在指纹比对阶段失败，上游索引服务连接超时；失败节点与重试次数已记录，可结合告警中心进一步处置。',
    timeline: [
      { time: '10:23:12', message: 'Worker: fingerprint phase started' },
      { time: '10:23:18', message: 'FP Service: connect 10.0.0.21:9200 timeout' },
      { time: '10:23:21', message: 'Worker: retry 1/3 failed' },
      { time: '10:23:30', message: 'Worker: task marked failed err=FINGERPRINT_UPSTREAM_TIMEOUT' },
      { time: '10:23:31', message: 'Alert: SCAN_ENGINE_DOWN emitted' },
    ],
    rawLogExcerpt: `[10:23:12] ERROR upstream connect timeout host=10.0.0.21:9200
[10:23:21] WARN retry attempt=1 max=3
[10:23:30] ERROR task failed code=FINGERPRINT_UPSTREAM_TIMEOUT
[10:23:31] INFO alert emitted level=critical`,
  },
  {
    traceId: 'trace-20260518-0110',
    minutesAgo: 240,
    username: 'auditor',
    module: '报告服务',
    operation: '导出报告',
    resourceObject: '飞控仿真V2-验收报告.pdf',
    ip: '10.0.0.8',
    result: 'success',
    auditConclusion: '报告导出经角色脱敏与水印处理后生成，下载令牌 15 分钟有效。',
    timeline: [
      { time: '14:20:01', message: 'UI: 请求导出 PDF 报告' },
      { time: '14:20:02', message: 'API: /v1/reports/export 202 Accepted' },
      { time: '14:20:18', message: 'Report Worker: render complete pages=42' },
      { time: '14:20:19', message: 'Storage: signed url issued ttl=900s' },
    ],
    rawLogExcerpt: `[14:20:01] INFO export request template=standard-acceptance
[14:20:18] INFO render complete report_id=report-003
[14:20:19] INFO download token issued user=auditor`,
  },
  {
    traceId: 'trace-20260518-0088',
    minutesAgo: 360,
    username: 'admin',
    module: '策略引擎',
    operation: '发布策略',
    resourceObject: '默认自主率阈值 v2.4.0',
    ip: '10.0.0.1',
    result: 'success',
    auditConclusion: '策略发布审批已通过，新版本 v2.4.0 已生效并写入审计索引。',
    timeline: [
      { time: '12:05:00', message: 'UI: 提交策略发布审批' },
      { time: '12:05:01', message: 'API: /v1/policies/publish 200 OK' },
      { time: '12:05:02', message: 'Approval: flow completed approver=张三' },
      { time: '12:05:03', message: 'Policy Store: version v2.4.0 activated' },
    ],
    rawLogExcerpt: `[12:05:00] INFO publish request policy_id=pol-001 version=v2.4.0
[12:05:02] INFO approval completed
[12:05:03] INFO policy activated`,
  },
  {
    traceId: 'trace-kb-index-v2406-rc1',
    minutesAgo: 180,
    username: 'engine',
    module: '知识库',
    operation: '索引构建',
    resourceObject: 'OpenFOAM v2406-rc1',
    ip: '10.0.0.12',
    result: 'success',
    auditConclusion: '版本 v2406-rc1 目录索引与指纹入库进行中，可通过 TraceID 查看构建日志。',
    timeline: [
      { time: '22:10:05', message: 'UI: 获取更新创建候选版本 v2406-rc1' },
      { time: '22:10:10', message: 'KB Service: index build started' },
      { time: '22:12:00', message: 'Indexer: directory tree parsed 68%' },
      { time: '22:14:30', message: 'Indexer: fingerprint batch 2/5 running' },
    ],
    rawLogExcerpt: `[22:10:10] INFO index build started version=v2406-rc1 trace=trace-kb-index-v2406-rc1
[22:12:00] INFO directory parsed progress=68%
[22:14:30] INFO fingerprint batch=2/5`,
  },
  {
    traceId: 'trace-20260517-0033',
    minutesAgo: 1440,
    username: 'engine',
    module: '知识库',
    operation: '获取更新',
    resourceObject: 'OpenFOAM v2312',
    ip: '10.0.0.12',
    result: 'failure',
    auditConclusion: '云端拉取更新包时网络中断，已保留上次成功快照，建议检查外网代理配置。',
    timeline: [
      { time: '09:10:00', message: 'UI: 触发 OpenFOAM 获取更新' },
      { time: '09:10:05', message: 'API: /v1/kb/fetch-update started' },
      { time: '09:12:40', message: 'Fetcher: connection reset by peer' },
      { time: '09:12:41', message: 'KB Service: rollback to snapshot v2311' },
    ],
    rawLogExcerpt: `[09:10:05] INFO fetch update kb_project=kb-openfoam
[09:12:40] ERROR fetch failed reason=connection_reset
[09:12:41] WARN rollback snapshot=v2311`,
  },
]

const EXTRA_OPERATIONS = [
  { module: '用户中心', operation: '用户登录', resource: 'admin' },
  { module: '用户中心', operation: '修改密码', resource: 'user-002' },
  { module: '告警中心', operation: '查看详情', resource: 'alert-pending-001' },
  { module: '开源风险', operation: '生成 SBOM', resource: 'task-003' },
  { module: '自主率检测', operation: '查看结果', resource: '全量扫描-006' },
  { module: '检测引擎', operation: '暂停任务', resource: 'task-004' },
  { module: '检测引擎', operation: '恢复任务', resource: 'task-004' },
  { module: '报告服务', operation: '删除报告', resource: 'report-002' },
  { module: '策略引擎', operation: '导入策略', resource: 'policy-import.yaml' },
  { module: '知识库', operation: '同步漏洞源', resource: 'GitHub Advisory' },
]

const USERS = ['admin', 'engine', 'auditor', 'worker-2', '张三', '李四']
const IPS = ['10.0.0.1', '10.0.0.8', '10.0.0.12', '10.0.0.21', '192.168.1.105']

function buildMockLogs(): LogListItem[] {
  const items: LogListItem[] = []

  LOG_SEEDS.forEach((seed, index) => {
    const occurredAt = dayjs().subtract(seed.minutesAgo, 'minute').toISOString()
    items.push({
      logId: `log-${String(index + 1).padStart(3, '0')}`,
      traceId: seed.traceId,
      occurredAt,
      username: seed.username,
      module: seed.module,
      operation: seed.operation,
      resourceObject: seed.resourceObject,
      ip: seed.ip,
      result: seed.result,
      relatedTaskId: seed.relatedTaskId,
    })
  })

  for (let i = 0; i < 16; i += 1) {
    const extra = EXTRA_OPERATIONS[i % EXTRA_OPERATIONS.length]
    const dayOffset = Math.floor(i / 3) + 1
    const occurredAt = dayjs()
      .subtract(dayOffset, 'day')
      .subtract(i * 17, 'minute')
      .toISOString()
    const result: LogResult = i % 5 === 0 ? 'failure' : 'success'

    items.push({
      logId: `log-${String(LOG_SEEDS.length + i + 1).padStart(3, '0')}`,
      traceId: `trace-202605${String(10 - (i % 7)).padStart(2, '0')}-${String(100 + i).padStart(4, '0')}`,
      occurredAt,
      username: USERS[i % USERS.length],
      module: extra.module,
      operation: extra.operation,
      resourceObject: extra.resource,
      ip: IPS[i % IPS.length],
      result,
      relatedTaskId: i % 4 === 0 ? `task-00${(i % 8) + 1}` : undefined,
    })
  }

  return items.sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  )
}

const MOCK_ALL_LOGS = buildMockLogs()

const LOG_DETAIL_BY_ID = new Map<string, LogDetail>()

LOG_SEEDS.forEach((seed, index) => {
  const logId = `log-${String(index + 1).padStart(3, '0')}`
  LOG_DETAIL_BY_ID.set(logId, {
    logId,
    traceId: seed.traceId,
    username: seed.username,
    sourceIp: seed.ip,
    result: seed.result,
    auditConclusion: seed.auditConclusion,
    timeline: seed.timeline,
    rawLogExcerpt: seed.rawLogExcerpt,
  })
})

/** mock 阶段按条件过滤日志列表 */
export function filterMockLogList(params: LogQueryParams): LogListItem[] {
  let list = [...MOCK_ALL_LOGS]

  if (params.traceId) {
    const keyword = params.traceId.toLowerCase()
    list = list.filter((item) => item.traceId.toLowerCase().includes(keyword))
  }

  if (params.username) {
    const keyword = params.username.toLowerCase()
    list = list.filter((item) => item.username.toLowerCase().includes(keyword))
  }

  if (params.resourceObject) {
    const keyword = params.resourceObject.toLowerCase()
    list = list.filter((item) => item.resourceObject.toLowerCase().includes(keyword))
  }

  if (params.result) {
    list = list.filter((item) => item.result === params.result)
  }

  if (params.taskId) {
    list = list.filter((item) => item.relatedTaskId === params.taskId)
  }

  if (params.occurredAtStart && params.occurredAtEnd) {
    const start = dayjs(params.occurredAtStart)
    const end = dayjs(params.occurredAtEnd)
    list = list.filter((item) => {
      const at = dayjs(item.occurredAt)
      return (at.isAfter(start) || at.isSame(start)) && (at.isBefore(end) || at.isSame(end))
    })
  }

  return list.sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  )
}

/** 获取全链路日志详情 mock */
export function getMockLogDetail(logId: string): LogDetail | null {
  const cached = LOG_DETAIL_BY_ID.get(logId)
  if (cached) return cached

  const found = MOCK_ALL_LOGS.find((item) => item.logId === logId)
  if (!found) return null

  return {
    logId: found.logId,
    traceId: found.traceId,
    username: found.username,
    sourceIp: found.ip,
    result: found.result,
    auditConclusion: `操作「${found.operation}」在模块「${found.module}」已记录，资源对象为 ${found.resourceObject}。`,
    timeline: [
      {
        time: dayjs(found.occurredAt).format('HH:mm:ss'),
        message: `UI: ${found.operation} (${found.resourceObject})`,
      },
      {
        time: dayjs(found.occurredAt).add(1, 'second').format('HH:mm:ss'),
        message: `API: audit event persisted trace=${found.traceId}`,
      },
    ],
    rawLogExcerpt: `[${dayjs(found.occurredAt).format('HH:mm:ss')}] INFO user=${found.username} module=${found.module} op=${found.operation} result=${found.result}`,
  }
}

function buildExportContent(params: LogExportParams, rows: LogListItem[]): string {
  if (params.format === 'json') {
    return JSON.stringify(
      rows.map((row) => ({
        traceId: row.traceId,
        occurredAt: row.occurredAt,
        username: row.username,
        module: row.module,
        operation: row.operation,
        resourceObject: row.resourceObject,
        ip: row.ip,
        result: row.result,
      })),
      null,
      2,
    )
  }

  const header = 'traceId,occurredAt,username,module,operation,resourceObject,ip,result'
  const body = rows
    .map((row) =>
      [
        row.traceId,
        row.occurredAt,
        row.username,
        row.module,
        row.operation,
        row.resourceObject,
        row.ip,
        row.result,
      ]
        .map((value) => `"${value.replace(/"/g, '""')}"`)
        .join(','),
    )
    .join('\n')

  return `${header}\n${body}`
}

/** 生成导出文件 mock 结果（浏览器 Blob URL） */
export function getMockLogExportResult(params: LogExportParams): LogExportResult {
  const rows = filterMockLogList({
    occurredAtStart: params.startTime,
    occurredAtEnd: params.endTime,
    page: 1,
    pageSize: 1000,
  })

  const content = buildExportContent(params, rows)
  const mimeType = params.format === 'json' ? 'application/json' : 'text/csv;charset=utf-8'
  const blob = new Blob([content], { type: mimeType })
  const startKey = params.startTime.slice(0, 10).replace(/-/g, '')
  const endKey = params.endTime.slice(0, 10).replace(/-/g, '')

  return {
    downloadUrl: URL.createObjectURL(blob),
    fileName: `system-logs-${startKey}-${endKey}.${params.format}`,
  }
}
