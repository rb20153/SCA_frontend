<template>
  <li :class="{ open: isDirectory && isExpanded }">
    <button
      type="button"
      class="tree-node"
      :class="nodeButtonClass"
      @click="handleNodeClick"
    >
      {{ nodeLabel }}
    </button>
    <ul v-if="isDirectory && node.children?.length">
      <LinuxStyleFileTreeNode
        v-for="child in node.children"
        :key="child.nodeId"
        :node="child"
      />
    </ul>
  </li>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import LinuxStyleFileTreeNode from '@/components/common/LinuxStyleFileTreeNode.vue'
import type { LinuxStyleFileTreeContext } from '@/components/common/linuxStyleFileTreeContext'
import type { FileTreeNode } from '@/types/fileTree'

const props = defineProps<{
  node: FileTreeNode
}>()

const treeContext = inject<LinuxStyleFileTreeContext>('linuxStyleFileTreeContext')

if (!treeContext) {
  throw new Error('LinuxStyleFileTreeNode 必须在 LinuxStyleFileTree 内使用')
}

const isDirectory = computed(() => props.node.type === 'directory')

const isExpanded = computed(() => treeContext.isExpanded(props.node.nodeId))

const isSelectedFile = computed(
  () => props.node.type === 'file' && treeContext.selectedFileId.value === props.node.nodeId,
)

/** 目录显示 name/，文件显示文件名 */
const nodeLabel = computed(() =>
  isDirectory.value ? `${props.node.name}/` : props.node.name,
)

const nodeButtonClass = computed(() => ({
  'tree-folder': isDirectory.value,
  'tree-file': !isDirectory.value,
  active: isSelectedFile.value,
}))

/** 目录点击切换展开；文件点击切换选中 */
function handleNodeClick() {
  if (isDirectory.value) {
    treeContext.toggleFolder(props.node.nodeId)
    return
  }
  treeContext.selectFile(props.node.nodeId)
}
</script>

<style scoped>
.tree-node {
  width: 100%;
  padding: 6px 10px;
  border: none;
  border-radius: 6px;
  background: transparent;
  text-align: left;
  color: rgba(0, 0, 0, 0.88);
  cursor: pointer;
}

.tree-node:hover {
  background: #f5f5f5;
}

.tree-folder::before {
  content: '▸';
  display: inline-block;
  width: 16px;
  color: rgba(0, 0, 0, 0.45);
}

li.open > .tree-folder::before {
  content: '▾';
}

.tree-file::before {
  content: '•';
  display: inline-block;
  width: 16px;
  color: rgba(0, 0, 0, 0.45);
}

.tree-file.active {
  color: #1677ff;
  background: #e6f4ff;
}
</style>
