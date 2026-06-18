import type { PolicyMaskingAction, PolicyRuleHitListItem, PolicyRuleHitScope } from '@/types/policy'

interface RuleHitSeed {
  ruleKeyword: string
  hitObject: string
  maskingAction: PolicyMaskingAction
  responsibleUser: string
  traceId: string
  hitScope: PolicyRuleHitScope
  hitSnippet: string
  processingResult: string
  occurredAt: string
}

const RULE_HIT_SEEDS: RuleHitSeed[] = [
  {
    ruleKeyword: 'token',
    hitObject: 'src/auth/config.yml',
    maskingAction: 'replace',
    responsibleUser: 'admin',
    traceId: 'trace-20260519-0001',
    hitScope: 'source',
    hitSnippet: 'api_token: ABCDEFGHIJKLMNOP',
    processingResult: '导出时按角色策略执行脱敏，审计记录包含导出人/时间/链接。',
    occurredAt: '2026-05-19T10:00:12+08:00',
  },
  {
    ruleKeyword: 'email',
    hitObject: '报告导出：飞控 V2 验收报告',
    maskingAction: 'summary-only',
    responsibleUser: 'auditor',
    traceId: 'trace-20260518-0099',
    hitScope: 'report-export',
    hitSnippet: '联系人: pilot@example.com\n抄送: qa-team@example.com',
    processingResult: '报告导出仅保留摘要字段，完整邮箱已脱敏并写入审计日志。',
    occurredAt: '2026-05-18T18:10:03+08:00',
  },
  {
    ruleKeyword: 'license-key',
    hitObject: 'lib/security/core.dll',
    maskingAction: 'block',
    responsibleUser: 'engineer01',
    traceId: 'trace-20260517-0042',
    hitScope: 'binary',
    hitSnippet: 'LICENSE_KEY=9F3A-88C2-11DE-0045',
    processingResult: '二进制扫描命中许可证密钥规则，已阻断导出并通知审计员复核。',
    occurredAt: '2026-05-17T14:22:41+08:00',
  },
  {
    ruleKeyword: 'password',
    hitObject: 'deploy/prod.env',
    maskingAction: 'replace',
    responsibleUser: 'admin',
    traceId: 'trace-20260516-0031',
    hitScope: 'source',
    hitSnippet: 'DB_PASSWORD=SuperSecret#2026',
    processingResult: '源码扫描命中密码规则，展示与导出均替换为 ***。',
    occurredAt: '2026-05-16T09:35:18+08:00',
  },
  {
    ruleKeyword: 'internal-url',
    hitObject: '报告导出：仿真平台季度审计报告',
    maskingAction: 'watermark',
    responsibleUser: 'auditor',
    traceId: 'trace-20260515-0028',
    hitScope: 'report-export',
    hitSnippet: '内网地址: http://10.12.8.21:8080/api',
    processingResult: '导出报告已叠加水印并记录下载人，内网地址在正文中已替换为占位符。',
    occurredAt: '2026-05-15T16:48:55+08:00',
  },
  {
    ruleKeyword: 'phone',
    hitObject: 'docs/contact.md',
    maskingAction: 'summary-only',
    responsibleUser: 'engineer02',
    traceId: 'trace-20260514-0017',
    hitScope: 'source',
    hitSnippet: '技术支持: 13800138000',
    processingResult: '手机号仅保留前三后四位，中间位脱敏。',
    occurredAt: '2026-05-14T11:12:07+08:00',
  },
  {
    ruleKeyword: 'certificate',
    hitObject: 'certs/client.p12',
    maskingAction: 'block',
    responsibleUser: 'admin',
    traceId: 'trace-20260513-0011',
    hitScope: 'binary',
    hitSnippet: '-----BEGIN CERTIFICATE-----\nMIIFazCCA1OgAwIBAgIRAIIQz7DSQAL...\n-----END CERTIFICATE-----',
    processingResult: '证书文件命中阻断规则，禁止随报告导出，需走审批通道。',
    occurredAt: '2026-05-13T08:05:33+08:00',
  },
  {
    ruleKeyword: 'token',
    hitObject: 'config/app.yaml',
    maskingAction: 'replace',
    responsibleUser: 'engineer01',
    traceId: 'trace-20260512-0008',
    hitScope: 'source',
    hitSnippet: 'service_token: mock_redacted_policy_hit_001',
    processingResult: '任务扫描阶段命中，结果页与导出均按策略脱敏。',
    occurredAt: '2026-05-12T15:20:44+08:00',
  },
  {
    ruleKeyword: 'email',
    hitObject: '报告导出：OpenFOAM 合规检测报告',
    maskingAction: 'replace',
    responsibleUser: 'auditor',
    traceId: 'trace-20260511-0005',
    hitScope: 'report-export',
    hitSnippet: '负责人邮箱: compliance@corp.example.com',
    processingResult: '报告导出脱敏完成，TraceID 已关联系统日志。',
    occurredAt: '2026-05-11T10:33:29+08:00',
  },
  {
    ruleKeyword: 'api-key',
    hitObject: 'scripts/deploy.sh',
    maskingAction: 'replace',
    responsibleUser: 'admin',
    traceId: 'trace-20260510-0003',
    hitScope: 'source',
    hitSnippet: 'export DEPLOY_API_KEY="ak_prod_7f8e9d0c1b2a"',
    processingResult: '脚本中的 API Key 已替换，审计记录保留命中片段哈希。',
    occurredAt: '2026-05-10T17:55:02+08:00',
  },
  {
    ruleKeyword: 'internal-ip',
    hitObject: 'lib/network/adapter.so',
    maskingAction: 'watermark',
    responsibleUser: 'engineer02',
    traceId: 'trace-20260509-0002',
    hitScope: 'binary',
    hitSnippet: 'default_gateway=192.168.10.1',
    processingResult: '二进制指纹比对命中内网 IP 规则，导出材料已加水印。',
    occurredAt: '2026-05-09T13:18:16+08:00',
  },
  {
    ruleKeyword: 'secret',
    hitObject: '报告导出：动力学仿真自主率周报',
    maskingAction: 'summary-only',
    responsibleUser: 'auditor',
    traceId: 'trace-20260508-0001',
    hitScope: 'report-export',
    hitSnippet: 'JWT_SECRET=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    processingResult: '周报导出仅展示脱敏摘要，完整密钥未出现在附件中。',
    occurredAt: '2026-05-08T09:42:50+08:00',
  },
]

const MOCK_RULE_HIT_TOTAL = 36

/** 按策略 ID 生成规则命中 mock 列表 */
function buildMockPolicyRuleHits(policyId: string): PolicyRuleHitListItem[] {
  return Array.from({ length: MOCK_RULE_HIT_TOTAL }, (_, index) => {
    const seed = RULE_HIT_SEEDS[index % RULE_HIT_SEEDS.length]
    const seq = index + 1

    return {
      hitId: `${policyId}-hit-${String(seq).padStart(3, '0')}`,
      policyId,
      occurredAt: new Date(
        new Date(seed.occurredAt).getTime() - index * 3_600_000,
      ).toISOString(),
      ruleKeyword: seed.ruleKeyword,
      hitObject: seed.hitObject,
      maskingAction: seed.maskingAction,
      responsibleUser: seed.responsibleUser,
      traceId: seed.traceId,
      hitScope: seed.hitScope,
    }
  })
}

const ruleHitCache = new Map<string, PolicyRuleHitListItem[]>()

/** 获取指定策略的全部命中 mock 数据（带缓存） */
export function getMockPolicyRuleHits(policyId: string): PolicyRuleHitListItem[] {
  const cached = ruleHitCache.get(policyId)
  if (cached) return cached

  const list = buildMockPolicyRuleHits(policyId)
  ruleHitCache.set(policyId, list)
  return list
}

/** 按 hitId 查找详情扩展字段 */
export function getMockPolicyRuleHitDetailSeed(hitId: string): RuleHitSeed | undefined {
  const match = /hit-(\d+)$/.exec(hitId)
  if (!match) return undefined
  const index = Number(match[1]) - 1
  return RULE_HIT_SEEDS[index % RULE_HIT_SEEDS.length]
}
