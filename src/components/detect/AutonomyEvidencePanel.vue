<template>
  <div class="autonomy-evidence-panel">
    <div class="result-content-layout">
      <a-card :bordered="false" class="result-tree-card">
        <template #title>
          <span class="panel-title">相似代码证据文件树</span>
        </template>
        <PageLoading :loading="treeLoading && treeNodes.length === 0">
          <LinuxStyleFileTree
            ref="treeRef"
            v-model:selected-file-id="selectedFileId"
            :nodes="treeNodes"
            :loading="treeLoading"
          />
        </PageLoading>
      </a-card>

      <a-card :bordered="false" class="result-detail-card">
        <div class="result-detail-body">
          <a-empty v-if="!selectedFile" description="请选择左侧文件" />
          <AutonomyFileDetailPanel
            v-else
            :task-id="taskId"
            :file-id="selectedFileId"
            :file-name="selectedFile.name"
          />
        </div>
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { getAutonomyDetectEvidenceTree } from '@/api/detect'
import LinuxStyleFileTree from '@/components/common/LinuxStyleFileTree.vue'
import PageLoading from '@/components/common/PageLoading.vue'
import AutonomyFileDetailPanel from '@/components/detect/AutonomyFileDetailPanel.vue'
import type { FileTreeNode } from '@/types/fileTree'
import { findFileTreeNodeById } from '@/utils/fileTree'

const props = defineProps<{
  /** 当前检测任务 ID */
  taskId: string
}>()

const treeRef = ref<InstanceType<typeof LinuxStyleFileTree> | null>(null)
const treeLoading = ref(false)
const treeNodes = ref<FileTreeNode[]>([])
const selectedFileId = ref<string | undefined>()

/** 当前选中的文件节点 */
const selectedFile = computed(() => {
  if (!selectedFileId.value) {
    return null
  }
  return findFileTreeNodeById(treeNodes.value, selectedFileId.value)
})

/** 进入页面时拉取证据文件树 */
async function fetchEvidenceTree() {
  treeLoading.value = true
  try {
    const res = await getAutonomyDetectEvidenceTree(props.taskId)
    treeNodes.value = res.data.nodes
  } finally {
    treeLoading.value = false
  }
}

/**
 * 按 nodeId 展开路径并选中（来源汇总「定位」，与 evidence 树 id 对齐）
 * @param nodeId - 证据树文件节点 ID
 */
function locateFileByNodeId(nodeId: string): boolean {
  const node = findFileTreeNodeById(treeNodes.value, nodeId)
  if (!node || node.type !== 'file') {
    return false
  }
  treeRef.value?.locateFile(nodeId)
  return true
}

/**
 * 按文件名展开路径并高亮（来源汇总「定位」回调）
 * @param fileName - 命中文件名或路径
 * @returns 是否定位成功
 */
function locateFileByName(fileName: string): boolean {
  return treeRef.value?.locateFileByName(fileName) ?? false
}

onMounted(fetchEvidenceTree)

defineExpose({
  locateFileByNodeId,
  locateFileByName,
})
</script>

<style scoped>
.result-content-layout {
  display: grid;
  grid-template-columns: minmax(200px, 1fr) minmax(0, 3fr);
  gap: 16px;
  align-items: stretch;
}

.panel-title {
  font-size: 16px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.88);
}

.result-tree-card,
.result-detail-card {
  min-height: 360px;
}

.result-detail-body {
  min-height: 280px;
}

@media (max-width: 992px) {
  .result-content-layout {
    grid-template-columns: 1fr;
  }
}
</style>
