import type { FileTreeNode } from '@/types/fileTree'

export interface FileTreeDefaultState {
  /** 展开至首个文件所需的目录 nodeId 集合 */
  expandedNodeIds: string[]
  /** 深度优先遍历遇到的第一个文件 nodeId */
  firstFileId: string | null
}

/**
 * 计算默认展开路径与首个文件（深度优先）
 * @param nodes - 树根节点列表
 */
export function computeFileTreeDefaultState(nodes: FileTreeNode[]): FileTreeDefaultState {
  const expandedNodeIds: string[] = []

  function walk(list: FileTreeNode[]): FileTreeNode | null {
    for (const node of list) {
      if (node.type === 'file') {
        return node
      }
      if (node.children?.length) {
        expandedNodeIds.push(node.nodeId)
        const found = walk(node.children)
        if (found) {
          return found
        }
        expandedNodeIds.pop()
      }
    }
    return null
  }

  const firstFile = walk(nodes)
  return {
    expandedNodeIds,
    firstFileId: firstFile?.nodeId ?? null,
  }
}

/**
 * 构建按目录深度限制展开时的 map（depth 0=第一级根目录）
 * @param nodes - 树根节点列表
 * @param maxExpandedDirectoryDepth - 仍保持展开的最大目录深度；0 = 仅第一级根目录
 */
export function buildExpandedMapToDirectoryDepth(
  nodes: FileTreeNode[],
  maxExpandedDirectoryDepth: number,
): Record<string, boolean> {
  const expanded: Record<string, boolean> = {}

  /** 递归收集需展开的目录 nodeId */
  function walk(list: FileTreeNode[], depth: number) {
    for (const node of list) {
      if (node.type !== 'directory' || !node.children?.length) {
        continue
      }
      if (depth <= maxExpandedDirectoryDepth) {
        expanded[node.nodeId] = true
      }
      walk(node.children, depth + 1)
    }
  }

  walk(nodes, 0)
  return expanded
}

/**
 * 构建「展开全部目录」时的展开 map
 * @param nodes - 树根节点列表
 */
export function buildExpandAllDirectoryMap(nodes: FileTreeNode[]): Record<string, boolean> {
  const expanded: Record<string, boolean> = {}
  for (const nodeId of collectDirectoryNodeIds(nodes)) {
    expanded[nodeId] = true
  }
  return expanded
}

/**
 * 在树中按 nodeId 查找文件节点
 * @param nodes - 树根节点列表
 * @param nodeId - 目标 nodeId
 */
export function findFileTreeNodeById(
  nodes: FileTreeNode[],
  nodeId: string,
): FileTreeNode | null {
  for (const node of nodes) {
    if (node.nodeId === nodeId) {
      return node
    }
    if (node.children?.length) {
      const found = findFileTreeNodeById(node.children, nodeId)
      if (found) {
        return found
      }
    }
  }
  return null
}

/**
 * 收集所有目录 nodeId（展开全部用，供后续扩展）
 * @param nodes - 树根节点列表
 */
export function collectDirectoryNodeIds(nodes: FileTreeNode[]): string[] {
  const ids: string[] = []

  function walk(list: FileTreeNode[]) {
    for (const node of list) {
      if (node.type === 'directory' && node.children?.length) {
        ids.push(node.nodeId)
        walk(node.children)
      }
    }
  }

  walk(nodes)
  return ids
}

/**
 * 在树中按文件名查找第一个文件 nodeId（深度优先）
 * @param nodes - 树根节点列表
 * @param fileName - 文件名（不含路径）
 */
export function findFileNodeIdByName(nodes: FileTreeNode[], fileName: string): string | null {
  for (const node of nodes) {
    if (node.type === 'file' && node.name === fileName) {
      return node.nodeId
    }
    if (node.children?.length) {
      const found = findFileNodeIdByName(node.children, fileName)
      if (found) {
        return found
      }
    }
  }
  return null
}

/**
 * 收集目标 nodeId 的祖先目录 nodeId 列表（用于展开路径）
 * @param nodes - 树根节点列表
 * @param targetNodeId - 目标 nodeId
 */
export function collectAncestorDirectoryIds(
  nodes: FileTreeNode[],
  targetNodeId: string,
  ancestors: string[] = [],
): string[] | null {
  for (const node of nodes) {
    if (node.nodeId === targetNodeId) {
      return ancestors
    }
    if (node.children?.length) {
      const nextAncestors =
        node.type === 'directory' ? [...ancestors, node.nodeId] : ancestors
      const found = collectAncestorDirectoryIds(node.children, targetNodeId, nextAncestors)
      if (found) {
        return found
      }
    }
  }
  return null
}

/**
 * 按关键字过滤文件树（匹配目录名、文件名或 MD5，保留命中文件的祖先目录）
 * @param nodes - 原始树
 * @param keyword - 检索关键词
 */
export function filterFileTreeByKeyword(nodes: FileTreeNode[], keyword: string): FileTreeNode[] {
  const q = keyword.trim().toLowerCase()
  if (!q) {
    return nodes
  }

  function walk(node: FileTreeNode): FileTreeNode | null {
    if (node.type === 'file') {
      const haystack = [node.name, node.path ?? '', node.md5 ?? ''].join(' ').toLowerCase()
      return haystack.includes(q) ? { ...node } : null
    }

    const children = (node.children ?? [])
      .map((child) => walk(child))
      .filter((child): child is FileTreeNode => child !== null)

    if (children.length === 0) {
      const dirMatch = node.name.toLowerCase().includes(q)
      return dirMatch ? { ...node, children: [] } : null
    }

    return { ...node, children }
  }

  return nodes.map((node) => walk(node)).filter((node): node is FileTreeNode => node !== null)
}

/** 格式化问题率数值（保留 1 位小数，整数不带 .0） */
export function formatFileTreeIssueRateValue(rate: number): string {
  const rounded = Math.round(rate * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

/**
 * 生成树节点问题率 Tag 文案；无 issueRate 时返回 null
 * @param node - 文件树节点
 */
export function formatFileTreeIssueRateLabel(node: FileTreeNode): string | null {
  if (node.issueRate === undefined) {
    return null
  }
  const pct = formatFileTreeIssueRateValue(node.issueRate)
  return node.type === 'directory' ? `整体问题率 ${pct}%` : `${pct}%`
}
