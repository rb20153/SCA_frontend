import type { AiParseResultDetail } from '@/types/detect'
import type { FileTreeLicenseTagColor, FileTreeNode } from '@/types/fileTree'

/** 创建带 License Tag 的文件节点 */
function licenseFile(
  name: string,
  localId: string,
  label: string,
  color: FileTreeLicenseTagColor,
): FileTreeNode {
  return {
    nodeId: localId,
    name,
    type: 'file',
    licenseLabel: label,
    licenseTagColor: color,
  }
}

/** 创建带 License Tag 的目录节点 */
function licenseDir(
  name: string,
  localId: string,
  label: string,
  color: FileTreeLicenseTagColor,
  children: FileTreeNode[],
): FileTreeNode {
  return {
    nodeId: localId,
    name,
    type: 'directory',
    licenseLabel: label,
    licenseTagColor: color,
    children,
  }
}

/** 原型 License 树（OpenFOAM-dev.git） */
function buildOpenFoamLicenseTree(): FileTreeNode[] {
  return [
    licenseDir('openfoam-v2312.tar.gz', 'dir-root', 'GPL-3.0', 'error', [
      licenseDir('依赖组件 · boost@1.82.0', 'dir-boost', 'BSL-1.0', 'success', [
        licenseFile('boost/geometry.hpp', 'file-boost-geo', 'BSL-1.0', 'success'),
      ]),
      licenseDir('依赖组件 · zlib@1.2.13', 'dir-zlib', 'Zlib', 'success', [
        licenseFile('zlib/inflate.c', 'file-zlib-inflate', 'Zlib', 'success'),
      ]),
      licenseDir('依赖组件 · custom-io@0.9.1', 'dir-custom-io', '未知', 'warning', [
        licenseFile('third_party/custom-io/LICENSE', 'file-custom-license', '待确认', 'warning'),
      ]),
    ]),
  ]
}

const MOCK_CONFLICTS = [
  '主工程为 GPL-3.0，若与闭源交付代码静态链接，需进一步评估传染风险。',
  '`custom-io@0.9.1` 未识别明确 SPDX，建议补充 LICENSE 或来源说明。',
  '当前未发现 Apache-2.0 与 GPL-3.0 的专利条款直接冲突，但需结合发布方式复核。',
]

/** 为 License 树 nodeId 加任务前缀 */
function prefixLicenseTree(nodes: FileTreeNode[], prefix: string): FileTreeNode[] {
  return nodes.map((node) => ({
    ...node,
    nodeId: `${prefix}:${node.nodeId}`,
    children: node.children ? prefixLicenseTree(node.children, prefix) : undefined,
  }))
}

/**
 * mock：按解析任务 ID 返回 AI 解析结果详情（抽屉用）
 * @param parseTaskId - 解析任务 ID
 */
export function getMockAiParseResultDetail(parseTaskId: string): AiParseResultDetail | null {
  const coverageMap: Record<string, number> = {
    'ai-parse-001': 93,
    'ai-parse-004': 88,
  }

  if (!coverageMap[parseTaskId]) {
    return null
  }

  const prefix = parseTaskId.replace(/\W/g, '') || '1'

  return {
    parseTaskId,
    parseObjectName:
      parseTaskId === 'ai-parse-004' ? 'solver-lib.tar.gz' : 'OpenFOAM-dev.git',
    scanDepth: parseTaskId === 'ai-parse-004' ? 2 : 3,
    finishedAt:
      parseTaskId === 'ai-parse-004'
        ? '2026-05-27T14:25:00+08:00'
        : '2026-05-29T09:42:00+08:00',
    aiParseCoverage: coverageMap[parseTaskId],
    licenseTreeNodes: prefixLicenseTree(buildOpenFoamLicenseTree(), prefix),
    licenseConflicts: MOCK_CONFLICTS,
  }
}
