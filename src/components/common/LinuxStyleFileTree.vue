<template>
  <div class="linux-style-file-tree">
    <a-spin :spinning="loading">
      <a-empty v-if="!loading && nodes.length === 0" description="暂无目录数据" />
      <ul v-else class="kb-tree">
        <LinuxStyleFileTreeNode
          v-for="node in nodes"
          :key="node.nodeId"
          :node="node"
        />
      </ul>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { provide, ref, watch } from 'vue'
import LinuxStyleFileTreeNode from '@/components/common/LinuxStyleFileTreeNode.vue'
import type { LinuxStyleFileTreeContext } from '@/components/common/linuxStyleFileTreeContext'
import type { FileTreeNode } from '@/types/fileTree'
import { buildExpandAllDirectoryMap, buildExpandedMapToDirectoryDepth, computeFileTreeDefaultState } from '@/utils/fileTree'

const props = withDefaults(
  defineProps<{
    /** 树根节点列表 */
    nodes: FileTreeNode[]
    loading?: boolean
  }>(),
  {
    loading: false,
  },
)

const selectedFileId = defineModel<string | undefined>('selectedFileId')

const expandedMap = ref<Record<string, boolean>>({})

/** 判断目录是否展开 */
function isExpanded(nodeId: string): boolean {
  return expandedMap.value[nodeId] === true
}

/** 切换目录展开 / 收起 */
function toggleFolder(nodeId: string) {
  expandedMap.value = {
    ...expandedMap.value,
    [nodeId]: !expandedMap.value[nodeId],
  }
}

/** 选中文件节点 */
function selectFile(nodeId: string) {
  selectedFileId.value = nodeId
}

/** 应用默认展开路径并选中首个文件 */
function applyDefaultTreeState(nodes: FileTreeNode[]) {
  if (nodes.length === 0) {
    expandedMap.value = {}
    selectedFileId.value = undefined
    return
  }

  const { expandedNodeIds, firstFileId } = computeFileTreeDefaultState(nodes)
  const nextExpanded: Record<string, boolean> = {}
  for (const nodeId of expandedNodeIds) {
    nextExpanded[nodeId] = true
  }
  expandedMap.value = nextExpanded
  selectedFileId.value = firstFileId ?? undefined
}

const treeContext: LinuxStyleFileTreeContext = {
  selectedFileId,
  isExpanded,
  toggleFolder,
  selectFile,
}

provide('linuxStyleFileTreeContext', treeContext)

watch(
  () => props.nodes,
  (nodes) => {
    applyDefaultTreeState(nodes)
  },
  { immediate: true, deep: true },
)

/** 展开所有目录节点 */
function expandAll() {
  if (props.nodes.length === 0) {
    return
  }
  expandedMap.value = buildExpandAllDirectoryMap(props.nodes)
}

/** 折叠至第一级目录（仅根目录展开，其子目录全部收起） */
function collapseToFirstLevel() {
  if (props.nodes.length === 0) {
    return
  }
  expandedMap.value = buildExpandedMapToDirectoryDepth(props.nodes, 0)
}

defineExpose({
  expandAll,
  collapseToFirstLevel,
})
</script>

<style scoped>
.linux-style-file-tree {
  min-height: 120px;
}

.kb-tree,
.kb-tree :deep(ul) {
  list-style: none;
  margin: 0;
  padding-left: 0;
}

.kb-tree :deep(ul) {
  padding-left: 18px;
}

.kb-tree :deep(li) {
  margin: 4px 0;
}

.kb-tree :deep(li > ul) {
  display: none;
}

.kb-tree :deep(li.open > ul) {
  display: block;
}
</style>
