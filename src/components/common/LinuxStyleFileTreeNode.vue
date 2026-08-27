<template>
  <li :class="{ open: isDirectory && isExpanded }">
    <button
      type="button"
      class="tree-node"
      :class="nodeButtonClass"
      @click="handleNodeClick"
    >
      <span class="tree-node-label">{{ nodeLabel }}</span>
      <span v-if="issueRateLabel" class="tree-issue-rate">{{ issueRateLabel }}</span>
      <a-tag
        v-if="node.licenseLabel"
        :color="node.licenseTagColor ?? 'default'"
        class="tree-license-tag"
      >
        {{ node.licenseLabel }}
      </a-tag>
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
import { formatFileTreeIssueRateLabel } from '@/utils/fileTree'

const props = defineProps<{
  node: FileTreeNode
}>()

const injectedTreeContext = inject<LinuxStyleFileTreeContext>('linuxStyleFileTreeContext')

if (!injectedTreeContext) {
  throw new Error('LinuxStyleFileTreeNode 必须在 LinuxStyleFileTree 内使用')
}

const treeContext: LinuxStyleFileTreeContext = injectedTreeContext

const isDirectory = computed(() => props.node.type === 'directory')

const isExpanded = computed(() => treeContext.isExpanded(props.node.nodeId))

const isSelectedFile = computed(
  () =>
    treeContext.selectable &&
    props.node.type === 'file' &&
    treeContext.selectedFileId.value === props.node.nodeId,
)

/** 目录显示 name/，文件显示文件名 */
const nodeLabel = computed(() =>
  isDirectory.value ? `${props.node.name}/` : props.node.name,
)

/** 问题率 Tag 文案；知识库目录树无 issueRate 时不展示 */
const issueRateLabel = computed(() => formatFileTreeIssueRateLabel(props.node))

const nodeButtonClass = computed(() => ({
  'tree-folder': isDirectory.value,
  'tree-file': !isDirectory.value,
  active: isSelectedFile.value,
}))

/** 目录点击切换展开；文件点击切换选中（selectable 为 false 时文件不可选） */
function handleNodeClick() {
  if (isDirectory.value) {
    treeContext.toggleFolder(props.node.nodeId)
    return
  }
  if (!treeContext.selectable) {
    return
  }
  treeContext.selectFile(props.node.nodeId)
}
</script>

<style scoped>
.tree-node {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  width: 100%;
  padding: 6px 10px;
  border: none;
  border-radius: 6px;
  background: transparent;
  text-align: left;
  color: rgba(0, 0, 0, 0.88);
  cursor: pointer;
}

.tree-node-label {
  flex: 0 1 auto;
}

.tree-issue-rate {
  display: inline-flex;
  align-items: center;
  margin-left: 8px;
  padding: 1px 8px;
  border-radius: 999px;
  background: #fff7e6;
  color: #d48806;
  font-size: 12px;
  line-height: 1.4;
  flex-shrink: 0;
}

.tree-license-tag {
  margin-left: auto;
  flex-shrink: 0;
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
