import type { FileTreeData, FileTreeNode } from '@/types/fileTree'

/** 创建带问题率的文件节点 */
function file(name: string, path: string, localId: string, issueRate: number): FileTreeNode {
  return {
    nodeId: localId,
    name,
    type: 'file',
    path,
    issueRate,
  }
}

/** 创建带整体问题率的目录节点 */
function dir(
  name: string,
  localId: string,
  issueRate: number,
  children: FileTreeNode[],
): FileTreeNode {
  return {
    nodeId: localId,
    name,
    type: 'directory',
    issueRate,
    children,
  }
}

/** 为节点 ID 加任务前缀，避免多任务间选中态串扰 */
function prefixNodeIds(nodes: FileTreeNode[], prefix: string): FileTreeNode[] {
  return nodes.map((node) => ({
    ...node,
    nodeId: `${prefix}:${node.nodeId}`,
    children: node.children ? prefixNodeIds(node.children, prefix) : undefined,
  }))
}

/** 原型 M05-S04-P01 相似代码证据树（含各节点问题率） */
function buildEvidenceTreeBase(): FileTreeNode[] {
  return [
    dir('src', 'dir-src', 18.2, [
      file('solver.cpp', 'src/solver.cpp', 'file-solver', 31.6),
      file('mesh.cpp', 'src/mesh.cpp', 'file-mesh', 12.4),
      file('boundary.cpp', 'src/boundary.cpp', 'file-boundary', 8.7),
    ]),
    dir('0', 'dir-zero', 9.1, [
      file('inlet', '0/inlet', 'file-inlet', 15.3),
      file('outlet', '0/outlet', 'file-outlet', 4.2),
    ]),
  ]
}

/**
 * mock：按任务 ID 返回自主率检测结果 · 相似代码证据文件树（含问题率）
 * @param taskId - 检测任务 ID
 */
export function getMockAutonomyDetectEvidenceTree(taskId: string): FileTreeData {
  const prefix = `task-${taskId}`
  return {
    nodes: prefixNodeIds(buildEvidenceTreeBase(), prefix),
  }
}
