/** 文件树节点类型：目录 / 文件 */
export type FileTreeNodeType = 'directory' | 'file'

/** License 树节点 Tag 颜色（Ant Design Vue a-tag color） */
export type FileTreeLicenseTagColor =
  | 'success'
  | 'warning'
  | 'error'
  | 'default'
  | 'processing'
  | 'blue'

/** Linux 风格文件树节点（目录可含 children，文件为叶子） */
export interface FileTreeNode {
  nodeId: string
  name: string
  type: FileTreeNodeType
  /** 文件相对路径，目录节点可省略 */
  path?: string
  /** 文件 MD5，供关键字哈希检索 */
  md5?: string
  /**
   * 问题率 0–100（自主率证据树等场景）
   * - 目录：展示「整体问题率 xx%」
   * - 文件：展示「xx%」
   */
  issueRate?: number
  /** License 展示文案（AI 解析 License 树等场景） */
  licenseLabel?: string
  /** License Tag 颜色，缺省为 default */
  licenseTagColor?: FileTreeLicenseTagColor
  children?: FileTreeNode[]
}

/** 文件树 API 返回结构 */
export interface FileTreeData {
  nodes: FileTreeNode[]
}
