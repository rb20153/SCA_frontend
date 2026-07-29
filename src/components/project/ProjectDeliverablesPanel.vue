<template>
  <div class="deliverables-panel">
    <ProjectDeliverableAddBar :project-id="project.projectId" />

    <PageLoading :loading="loading && deliverableList.length === 0">
      <ListEmptyGuide
        v-if="!loading && deliverableList.length === 0"
        title="暂无交付物"
        description="点击上方「添加交付物」上传源码包或二进制文件"
      />
      <ProjectDeliverableTable
        v-else
        :deliverables="deliverableList"
        :loading="loading"
        :pagination="pagination"
        :downloading-id="downloadingId"
        @view-source="handleViewSource"
        @download="handleDownload"
        @delete="openDeleteModal"
      />
    </PageLoading>

    <ProjectDeleteDeliverableModal
      v-model:open="deleteVisible"
      :project-id="project.projectId"
      :project-name="project.projectName"
      :deliverable="deletingDeliverable"
      @success="refresh"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { getProjectDeliverableDownload, getProjectDeliverableList } from '@/api/project'
import ListEmptyGuide from '@/components/common/ListEmptyGuide.vue'
import PageLoading from '@/components/common/PageLoading.vue'
import ProjectDeleteDeliverableModal from '@/components/project/ProjectDeleteDeliverableModal.vue'
import ProjectDeliverableAddBar from '@/components/project/ProjectDeliverableAddBar.vue'
import ProjectDeliverableTable from '@/components/project/ProjectDeliverableTable.vue'
import { usePaginatedList } from '@/composables/usePaginatedList'
import type { Project, ProjectDeliverable } from '@/types/project'
import { copyTextToClipboard } from '@/utils/projectDeliverableDisplay'
import { triggerReportDownload } from '@/utils/reportDownload'

const props = defineProps<{
  project: Project
  visible: boolean
}>()

const deleteVisible = ref(false)
const deletingDeliverable = ref<ProjectDeliverable | null>(null)
const downloadingId = ref<string | null>(null)

const {
  loading,
  list: deliverableList,
  pagination,
  loadPage,
  refresh,
} = usePaginatedList<ProjectDeliverable>(
  async (params) =>
    (await getProjectDeliverableList({ ...params, projectId: props.project.projectId })).data,
  { pageSize: 10, immediate: false },
)

/** 打开删除确认弹窗 */
function openDeleteModal(deliverable: ProjectDeliverable) {
  deletingDeliverable.value = deliverable
  deleteVisible.value = true
}

/** 复制仓库 URL 并在新标签页打开 */
async function handleViewSource(deliverable: ProjectDeliverable) {
  const url = deliverable.repositoryUrl?.trim()
  if (!url) {
    message.warning('暂无仓库地址')
    return
  }

  try {
    await copyTextToClipboard(url)
    message.success('仓库地址已复制')
  } catch {
    message.warning('复制失败，请手动复制')
  }

  window.open(url, '_blank', 'noopener,noreferrer')
}

/** 点击下载时向后端请求下载链接并触发浏览器下载 */
async function handleDownload(deliverable: ProjectDeliverable) {
  if (downloadingId.value) {
    return
  }

  downloadingId.value = deliverable.deliverableId
  try {
    const res = await getProjectDeliverableDownload(
      props.project.projectId,
      deliverable.deliverableId,
    )
    await triggerReportDownload(res.data.downloadUrl, res.data.fileName)
  } catch (error) {
    message.error(error instanceof Error ? error.message : '下载失败')
  } finally {
    downloadingId.value = null
  }
}

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      loadPage()
    }
  },
  { immediate: true },
)
</script>

<style scoped>
.deliverables-panel {
  min-height: 200px;
}
</style>
