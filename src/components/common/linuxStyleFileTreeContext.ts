import type { Ref } from 'vue'

/** LinuxStyleFileTree 向子节点 inject 的上下文 */
export interface LinuxStyleFileTreeContext {
  selectedFileId: Ref<string | undefined>
  isExpanded: (nodeId: string) => boolean
  toggleFolder: (nodeId: string) => void
  selectFile: (nodeId: string) => void
}
