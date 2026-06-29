<template>
  <div class="page-container">
    <ReportTemplateCreateBar @create="createVisible = true" />

    <ReportTemplateQueryBar
      v-model="filterForm"
      @search="handleSearch"
      @reset="handleReset"
    />

    <a-card :bordered="false" class="table-card">
      <PageLoading :loading="loading && templateList.length === 0">
        <ListEmptyGuide
          v-if="!loading && templateList.length === 0"
          title="暂无报告模板"
          description="点击上方「新建模板」创建第一个报告模板"
        />
        <ReportTemplateTable
          v-else
          :templates="templateList"
          :loading="loading"
          :pagination="pagination"
          @delete="openDeleteModal"
          @publish="openPublishModal"
          @unpublish="openUnpublishModal"
          @failure-reason="openFailureReasonModal"
        />
      </PageLoading>
    </a-card>

    <ReportTemplateCreateModal
      v-model:open="createVisible"
      :templates="copyFromTemplates"
      @navigate="onCreateNavigate"
    />

    <ReportTemplateDeleteModal
      v-if="deletingTemplate"
      v-model:open="deleteVisible"
      :template="deletingTemplate"
      @success="onDeleteSuccess"
    />

    <ReportTemplatePublishModal
      v-if="publishingTemplate"
      v-model:open="publishVisible"
      :template="publishingTemplate"
      @success="onPublishSuccess"
    />

    <ReportTemplateUnpublishModal
      v-if="unpublishingTemplate"
      v-model:open="unpublishVisible"
      :template="unpublishingTemplate"
      @success="onUnpublishSuccess"
    />

    <ReportTemplatePublishFailureModal
      v-if="failureReasonTemplate"
      v-model:open="failureReasonVisible"
      :template-id="failureReasonTemplate.templateId"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { getReportTemplateList } from '@/api/reportTemplate'
import ListEmptyGuide from '@/components/common/ListEmptyGuide.vue'
import PageLoading from '@/components/common/PageLoading.vue'
import ReportTemplateCreateBar from '@/components/report/ReportTemplateCreateBar.vue'
import ReportTemplateCreateModal from '@/components/report/ReportTemplateCreateModal.vue'
import ReportTemplateDeleteModal from '@/components/report/ReportTemplateDeleteModal.vue'
import ReportTemplatePublishFailureModal from '@/components/report/ReportTemplatePublishFailureModal.vue'
import ReportTemplatePublishModal from '@/components/report/ReportTemplatePublishModal.vue'
import ReportTemplateQueryBar from '@/components/report/ReportTemplateQueryBar.vue'
import ReportTemplateTable from '@/components/report/ReportTemplateTable.vue'
import ReportTemplateUnpublishModal from '@/components/report/ReportTemplateUnpublishModal.vue'
import { useFilteredPaginatedList } from '@/composables/useFilteredPaginatedList'
import type { ReportTemplate } from '@/types/reportTemplate'
import {
  createEmptyReportTemplateListFilters,
  reportTemplateListFiltersToQuery,
} from '@/utils/reportTemplateQuery'

const router = useRouter()

const createVisible = ref(false)
const deleteVisible = ref(false)
const deletingTemplate = ref<ReportTemplate | null>(null)
const publishVisible = ref(false)
const publishingTemplate = ref<ReportTemplate | null>(null)
const unpublishVisible = ref(false)
const unpublishingTemplate = ref<ReportTemplate | null>(null)
const failureReasonVisible = ref(false)
const failureReasonTemplate = ref<ReportTemplate | null>(null)
const copyFromTemplates = ref<ReportTemplate[]>([])

const {
  filterForm,
  loading,
  list: templateList,
  pagination,
  loadPage,
  handleSearch,
  handleReset,
} = useFilteredPaginatedList<ReportTemplate, ReturnType<typeof createEmptyReportTemplateListFilters>>(
  async (params) => (await getReportTemplateList(params)).data,
  {
    createEmptyFilters: createEmptyReportTemplateListFilters,
    filtersToQuery: reportTemplateListFiltersToQuery,
    pageSize: 10,
  },
)

/** 加载「复制自」下拉所需的模板列表 */
async function fetchCopyFromTemplates() {
  const res = await getReportTemplateList({ page: 1, pageSize: 100 })
  copyFromTemplates.value = res.data.list
}

/** 打开删除确认弹窗 */
function openDeleteModal(template: ReportTemplate) {
  deletingTemplate.value = template
  deleteVisible.value = true
}

/** 打开发布确认弹窗 */
function openPublishModal(template: ReportTemplate) {
  publishingTemplate.value = template
  publishVisible.value = true
}

/** 打开取消发布确认弹窗 */
function openUnpublishModal(template: ReportTemplate) {
  unpublishingTemplate.value = template
  unpublishVisible.value = true
}

/** 打开发布失败原因弹窗 */
function openFailureReasonModal(template: ReportTemplate) {
  failureReasonTemplate.value = template
  failureReasonVisible.value = true
}

/** 新建弹窗确认后进入编辑器（不发保存请求） */
function onCreateNavigate(draft: { templateName: string; copyFromTemplateId?: string }) {
  router.push({
    path: '/reports/templates/new/edit',
    state: { draft },
  })
}

/** 删除成功后更新列表；若当前页删空且非第一页则回退一页 */
async function onDeleteSuccess() {
  const deletedId = deletingTemplate.value?.templateId
  deletingTemplate.value = null
  message.success('删除成功')

  if (!deletedId) {
    await loadPage()
    await fetchCopyFromTemplates()
    return
  }

  templateList.value = templateList.value.filter((item) => item.templateId !== deletedId)
  copyFromTemplates.value = copyFromTemplates.value.filter((item) => item.templateId !== deletedId)

  if (typeof pagination.total === 'number' && pagination.total > 0) {
    pagination.total -= 1
  }

  if (templateList.value.length === 0 && (pagination.current ?? 1) > 1) {
    pagination.current = (pagination.current ?? 1) - 1
    await loadPage()
  }
}

/** 发布成功后更新列表项状态为已发布 */
function onPublishSuccess(updated: ReportTemplate) {
  publishingTemplate.value = null
  updateTemplateInLists(updated)
}

/** 取消发布成功后更新列表项状态为草稿 */
function onUnpublishSuccess(updated: ReportTemplate) {
  unpublishingTemplate.value = null
  message.success('已取消发布')
  updateTemplateInLists(updated)
}

/** 同步更新当前页列表与复制自列表中的模板项 */
function updateTemplateInLists(updated: ReportTemplate) {
  const index = templateList.value.findIndex((item) => item.templateId === updated.templateId)
  if (index >= 0) {
    templateList.value[index] = updated
  }

  const copyIndex = copyFromTemplates.value.findIndex((item) => item.templateId === updated.templateId)
  if (copyIndex >= 0) {
    copyFromTemplates.value[copyIndex] = updated
  }
}

onMounted(() => {
  fetchCopyFromTemplates()
})
</script>

<style scoped>
.page-container {
  min-height: 100%;
}
</style>
