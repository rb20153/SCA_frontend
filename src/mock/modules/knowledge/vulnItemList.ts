import type {
  VulnItemDetail,
  VulnItemLevel,
  VulnItemListItem,
  VulnItemListQueryParams,
  VulnItemStatus,
} from '@/types/knowledge'
import { getMockVulnSourceById } from '@/mock/modules/knowledge/vulnSourceList'
import { VULN_SOURCE_CODE_LABEL } from '@/utils/vulnKnowledgeDisplay'
import dayjs from 'dayjs'

interface VulnItemSeed {
  identifier: string
  sourceCode: keyof typeof VULN_SOURCE_CODE_LABEL
  level: VulnItemLevel
  affectedComponent: string
  hoursAgo: number
  status: VulnItemStatus
  cvssScore: number
  description: string
  fixedVersion: string
  referenceLinks: string[]
}

const ITEM_SEEDS: VulnItemSeed[] = [
  {
    identifier: 'CVE-2024-1234',
    sourceCode: 'nvd',
    level: 'high',
    affectedComponent: 'openssl@3.0.8',
    hoursAgo: 2,
    status: 'pending_action',
    cvssScore: 8.5,
    description:
      'OpenSSL 3.0.8 在特定握手路径中存在缓冲区边界校验缺失，可能导致远程代码执行。',
    fixedVersion: '3.0.9',
    referenceLinks: [
      'https://nvd.nist.gov/vuln/detail/CVE-2024-1234',
      'https://github.com/openssl/openssl/security/advisories/GHSA-xxxx',
    ],
  },
  {
    identifier: 'CVE-2024-3094',
    sourceCode: 'osv',
    level: 'high',
    affectedComponent: 'xz-utils@5.6.0',
    hoursAgo: 3,
    status: 'needs_review',
    cvssScore: 10,
    description:
      'xz-utils 5.6.0 发行包中被植入恶意后门代码，可在特定 SSH 认证路径触发未授权访问。',
    fixedVersion: '5.6.1',
    referenceLinks: ['https://osv.dev/vulnerability/GHSA-xz-utils-2024'],
  },
  {
    identifier: 'CNVD-2024-55661',
    sourceCode: 'cnvd',
    level: 'medium',
    affectedComponent: 'zlib@1.2.13',
    hoursAgo: 5,
    status: 'synced',
    cvssScore: 6.5,
    description: 'zlib 在解压畸形 DEFLATE 流时存在越界读取，可能导致服务进程崩溃。',
    fixedVersion: '1.2.14',
    referenceLinks: ['https://www.cnvd.org.cn/flaw/show/CNVD-2024-55661'],
  },
  {
    identifier: 'CVE-2024-2201',
    sourceCode: 'nvd',
    level: 'high',
    affectedComponent: 'eigen@3.4.0',
    hoursAgo: 8,
    status: 'synced',
    cvssScore: 7.8,
    description: 'Eigen 矩阵分解模块在特定稀疏矩阵输入下触发堆溢出，影响数值仿真稳定性。',
    fixedVersion: '3.4.1',
    referenceLinks: ['https://nvd.nist.gov/vuln/detail/CVE-2024-2201'],
  },
  {
    identifier: 'GHSA-9q7r-2w3p',
    sourceCode: 'github_advisory',
    level: 'medium',
    affectedComponent: 'fmt@10.1.1',
    hoursAgo: 12,
    status: 'pending_action',
    cvssScore: 5.9,
    description: 'fmt 库格式化宽字符串时未正确处理边界，可能导致信息泄露。',
    fixedVersion: '10.2.0',
    referenceLinks: ['https://github.com/fmtlib/fmt/security/advisories/GHSA-9q7r-2w3p'],
  },
  {
    identifier: 'CVE-2023-48795',
    sourceCode: 'nvd',
    level: 'medium',
    affectedComponent: 'openssl@3.0.12',
    hoursAgo: 26,
    status: 'synced',
    cvssScore: 5.9,
    description: 'TLS 协议存在 Terrapin 攻击面，特定握手重协商可导致完整性降级。',
    fixedVersion: '3.0.13',
    referenceLinks: [
      'https://nvd.nist.gov/vuln/detail/CVE-2023-48795',
      'https://terrapin-attack.com',
    ],
  },
  {
    identifier: 'CVE-2024-6387',
    sourceCode: 'osv',
    level: 'high',
    affectedComponent: 'openssh@9.6p1',
    hoursAgo: 30,
    status: 'needs_review',
    cvssScore: 8.1,
    description: 'OpenSSH 服务端在特定 glibc 版本组合下存在竞态条件，可能导致未认证 RCE。',
    fixedVersion: '9.8p1',
    referenceLinks: ['https://osv.dev/vulnerability/CVE-2024-6387'],
  },
  {
    identifier: 'CNVD-2024-10234',
    sourceCode: 'cnvd',
    level: 'low',
    affectedComponent: 'boost@1.83.0',
    hoursAgo: 48,
    status: 'synced',
    cvssScore: 3.7,
    description: 'Boost.Asio 在异常网络包序列下可能产生日志风暴，影响磁盘 IO。',
    fixedVersion: '1.84.0',
    referenceLinks: ['https://www.cnvd.org.cn/flaw/show/CNVD-2024-10234'],
  },
  {
    identifier: 'CVE-2024-32002',
    sourceCode: 'github_advisory',
    level: 'high',
    affectedComponent: 'git@2.43.0',
    hoursAgo: 52,
    status: 'pending_action',
    cvssScore: 9.1,
    description: 'Git 子模块符号链接处理缺陷可导致恶意仓库在 clone 时写入工作区外路径。',
    fixedVersion: '2.45.1',
    referenceLinks: ['https://github.com/git/git/security/advisories/GHSA-2w5m-9c8v-5x9p'],
  },
  {
    identifier: 'CVE-2024-1597',
    sourceCode: 'nvd',
    level: 'low',
    affectedComponent: 'postgresql@15.6',
    hoursAgo: 72,
    status: 'synced',
    cvssScore: 2.7,
    description: 'PostgreSQL JDBC 驱动在特定 SSL 参数组合下可能跳过证书校验。',
    fixedVersion: '15.7',
    referenceLinks: ['https://nvd.nist.gov/vuln/detail/CVE-2024-1597'],
  },
  {
    identifier: 'CVE-2024-24557',
    sourceCode: 'osv',
    level: 'medium',
    affectedComponent: 'docker@25.0.3',
    hoursAgo: 80,
    status: 'needs_review',
    cvssScore: 6.9,
    description: 'Docker 构建缓存层在跨项目复用时可能泄露前一镜像层中的敏感环境变量。',
    fixedVersion: '25.0.5',
    referenceLinks: ['https://osv.dev/vulnerability/CVE-2024-24557'],
  },
  {
    identifier: 'CNVD-2024-77882',
    sourceCode: 'cnvd',
    level: 'high',
    affectedComponent: 'log4j@2.17.1',
    hoursAgo: 96,
    status: 'synced',
    cvssScore: 8.8,
    description: 'Log4j 在特定 Lookup 配置下仍存在 JNDI 注入风险变种，需升级至安全分支。',
    fixedVersion: '2.23.1',
    referenceLinks: ['https://www.cnvd.org.cn/flaw/show/CNVD-2024-77882'],
  },
  {
    identifier: 'CVE-2024-1086',
    sourceCode: 'nvd',
    level: 'high',
    affectedComponent: 'linux-kernel@6.1.76',
    hoursAgo: 120,
    status: 'pending_action',
    cvssScore: 7.8,
    description: 'Linux netfilter 子系统在 nf_tables 路径存在 use-after-free，本地提权风险。',
    fixedVersion: '6.1.80',
    referenceLinks: ['https://nvd.nist.gov/vuln/detail/CVE-2024-1086'],
  },
  {
    identifier: 'GHSA-m3p4-5n6q',
    sourceCode: 'github_advisory',
    level: 'low',
    affectedComponent: 'lodash@4.17.20',
    hoursAgo: 140,
    status: 'synced',
    cvssScore: 3.1,
    description: 'lodash 模板函数在不可信输入下可能触发原型污染，影响对象合并逻辑。',
    fixedVersion: '4.17.21',
    referenceLinks: ['https://github.com/lodash/lodash/security/advisories/GHSA-m3p4-5n6q'],
  },
  {
    identifier: 'CVE-2024-21413',
    sourceCode: 'nvd',
    level: 'medium',
    affectedComponent: 'microsoft-outlook@2021',
    hoursAgo: 168,
    status: 'needs_review',
    cvssScore: 6.5,
    description: 'Outlook 在处理特定 monikers 链接时可能绕过 Protected View，需用户交互触发。',
    fixedVersion: '2024-02 安全更新',
    referenceLinks: ['https://nvd.nist.gov/vuln/detail/CVE-2024-21413'],
  },
  {
    identifier: 'CVE-2024-3400',
    sourceCode: 'osv',
    level: 'high',
    affectedComponent: 'paloalto-panos@11.1.0',
    hoursAgo: 200,
    status: 'pending_action',
    cvssScore: 10,
    description: 'PAN-OS GlobalProtect 门户在特定配置下存在未认证命令注入，可导致设备接管。',
    fixedVersion: '11.1.2-h3',
    referenceLinks: ['https://osv.dev/vulnerability/CVE-2024-3400'],
  },
  {
    identifier: 'CNVD-2024-33445',
    sourceCode: 'cnvd',
    level: 'medium',
    affectedComponent: 'ffmpeg@6.1.1',
    hoursAgo: 220,
    status: 'synced',
    cvssScore: 5.5,
    description: 'FFmpeg 在解析畸形 HEVC 流时存在堆缓冲区溢出，影响媒体转码服务。',
    fixedVersion: '6.1.2',
    referenceLinks: ['https://www.cnvd.org.cn/flaw/show/CNVD-2024-33445'],
  },
  {
    identifier: 'CVE-2024-21762',
    sourceCode: 'nvd',
    level: 'high',
    affectedComponent: 'fortios@7.4.2',
    hoursAgo: 240,
    status: 'synced',
    cvssScore: 9.6,
    description: 'FortiOS SSL VPN 在特定 HTTP 请求路径存在越界写入，可导致远程代码执行。',
    fixedVersion: '7.4.3',
    referenceLinks: ['https://nvd.nist.gov/vuln/detail/CVE-2024-21762'],
  },
]

const SOURCE_ID_BY_CODE: Record<keyof typeof VULN_SOURCE_CODE_LABEL, string> = {
  nvd: 'vsrc-builtin-01',
  cnvd: 'vsrc-builtin-02',
  osv: 'vsrc-builtin-03',
  github_advisory: 'vsrc-builtin-04',
}

function buildListItem(seed: VulnItemSeed, index: number): VulnItemListItem {
  const sourceName = VULN_SOURCE_CODE_LABEL[seed.sourceCode]
  const sourceId = SOURCE_ID_BY_CODE[seed.sourceCode]

  return {
    itemId: `vitem-${String(index + 1).padStart(3, '0')}`,
    identifier: seed.identifier,
    sourceId,
    sourceName,
    level: seed.level,
    affectedComponent: seed.affectedComponent,
    updatedAt: dayjs().subtract(seed.hoursAgo, 'hour').toISOString(),
    status: seed.status,
  }
}

function buildDetail(seed: VulnItemSeed, itemId: string, sourceName: string): VulnItemDetail {
  return {
    itemId,
    identifier: seed.identifier,
    sourceName,
    level: seed.level,
    cvssScore: seed.cvssScore,
    description: seed.description,
    affectedComponent: seed.affectedComponent,
    fixedVersion: seed.fixedVersion,
    referenceLinks: seed.referenceLinks,
  }
}

const MOCK_VULN_ITEMS: VulnItemListItem[] = ITEM_SEEDS.map(buildListItem)

const VULN_ITEM_DETAIL_BY_ID = new Map<string, VulnItemDetail>(
  ITEM_SEEDS.map((seed, index) => {
    const item = MOCK_VULN_ITEMS[index]
    return [item.itemId, buildDetail(seed, item.itemId, item.sourceName)] as const
  }),
)

/** 获取全量漏洞条目 mock 列表 */
export function getAllMockVulnItems(): VulnItemListItem[] {
  return [...MOCK_VULN_ITEMS]
}

/** 关键词是否命中条目（编号 / 影响组件） */
function matchesKeyword(item: VulnItemListItem, keyword: string): boolean {
  const lower = keyword.toLowerCase()
  return (
    item.identifier.toLowerCase().includes(lower) ||
    item.affectedComponent.toLowerCase().includes(lower)
  )
}

/** mock 阶段按条件过滤漏洞条目列表（不分页） */
export function filterMockVulnItemList(
  params: Omit<VulnItemListQueryParams, 'page' | 'pageSize'>,
): VulnItemListItem[] {
  let list = getAllMockVulnItems()

  if (params.sourceId) {
    const source = getMockVulnSourceById(params.sourceId)
    if (source) {
      list = list.filter((item) => item.sourceId === params.sourceId)
    } else {
      list = []
    }
  } else if (params.sourceName?.trim()) {
    const nameKeyword = params.sourceName.trim().toLowerCase()
    list = list.filter((item) => item.sourceName.toLowerCase().includes(nameKeyword))
  }

  if (params.level) {
    list = list.filter((item) => item.level === params.level)
  }

  if (params.status) {
    list = list.filter((item) => item.status === params.status)
  }

  const identifier = params.identifier?.trim()
  if (identifier) {
    const idLower = identifier.toLowerCase()
    list = list.filter((item) => item.identifier.toLowerCase().includes(idLower))
  }

  const keyword = params.keyword?.trim()
  if (keyword) {
    list = list.filter((item) => matchesKeyword(item, keyword))
  }

  return list.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
}

/** mock 阶段按条件过滤并分页漏洞条目列表 */
export function getMockVulnItemListPage(
  params: VulnItemListQueryParams,
): { list: VulnItemListItem[]; total: number } {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 10
  const sorted = filterMockVulnItemList(params)
  const start = (page - 1) * pageSize

  return {
    list: sorted.slice(start, start + pageSize),
    total: sorted.length,
  }
}

/** 获取漏洞条目详情 mock */
export function getMockVulnItemDetail(itemId: string): VulnItemDetail | null {
  const cached = VULN_ITEM_DETAIL_BY_ID.get(itemId)
  if (cached) return cached

  const found = MOCK_VULN_ITEMS.find((item) => item.itemId === itemId)
  if (!found) return null

  const seedIndex = MOCK_VULN_ITEMS.findIndex((item) => item.itemId === itemId)
  const seed = ITEM_SEEDS[seedIndex]
  if (!seed) return null

  return buildDetail(seed, found.itemId, found.sourceName)
}

/** 统计跨来源重复编号数（mock：全库视图用） */
export function countMockCrossSourceDuplicates(
  items: VulnItemListItem[],
): number {
  const byIdentifier = new Map<string, Set<string>>()

  items.forEach((item) => {
    const sources = byIdentifier.get(item.identifier) ?? new Set<string>()
    sources.add(item.sourceId)
    byIdentifier.set(item.identifier, sources)
  })

  let duplicateCount = 0
  byIdentifier.forEach((sources) => {
    if (sources.size > 1) duplicateCount += 1
  })

  return duplicateCount
}
