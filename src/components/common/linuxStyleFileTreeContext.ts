import type { Ref } from 'vue'

/** LinuxStyleFileTree 向子节点 inject 的上下文 */
export interface LinuxStyleFileTreeContext {
  selectedFileId: Ref<string | undefined>
  /** 是否允许选中文件高亮；License 树等只读场景为 false */
  selectable: boolean
  isExpanded: (nodeId: string) => boolean
  toggleFolder: (nodeId: string) => void
  selectFile: (nodeId: string) => void
}
