<template>
  <div class="page-container">
    <ReportCreateBar @generate="generateVisible = true" />

    <ReportQueryBar
      v-model="filterForm"
      @search="handleSearch"
      @reset="handleReset"
    />

    <a-card :bordered="false" class="table-card">
      <PageLoading :loading="loading && reportList.length === 0">
        <ListEmptyGuide
          v-if="!loading && reportList.length === 0"
          title="暂无报告"
          description="点击上方「生成检测报告」创建第一份报告"
        />
        <ReportTable
          v-else
          :reports="reportList"
          :loading="loading"
          :pagination="pagination"
          :download-checking="downloadChecking"
          @delete="openDeleteModal"
          @failure-reason="openFailureReasonModal"
          @download="handleDownloadClick"
          @view="openDetailDrawer"
        />
      </PageLoading>
    </a-card>

    <ReportGenerateModal
      v-model:open="generateVisible"
      @success="onGenerateSuccess"
    />

    <ReportDeleteModal
      v-if="deletingReport"
      v-model:open="deleteVisible"
      :report="deletingReport"
      @success="onDeleteSuccess"
    />

    <ReportFailureReasonModal
      v-if="failureReasonReport"
      v-model:open="failureReasonVisible"
      :report-id="failureReasonReport.reportId"
    />

    <ReportDownloadModal
      v-if="downloadReport && downloadExportPolicy"
      v-model:open="downloadVisible"
      :report="downloadReport"
      :export-policy="downloadExportPolicy"
      :application-id="downloadApplicationId"
    />

    <ReportDetailDrawer
      v-model:open="detailVisible"
      :report="detailReport"
    />
    <ReportDownloadApplicationModal
      v-model:open="applicationVisible"
      :report="applicationReport"
      :export-policy="downloadExportPolicy"
      @success="loadPage"
    />
    <ReportDownloadApprovalDrawer v-model:open="approvalVisible" :application-id="approvalApplicationId" @success="loadPage" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { createReportDownload, getReportDownloadStatus, getReportList } from '@/api/report'
import ListEmptyGuide from '@/components/common/ListEmptyGuide.vue'
import PageLoading from '@/components/common/PageLoading.vue'
import ReportCreateBar from '@/components/report/ReportCreateBar.vue'
import ReportDeleteModal from '@/components/report/ReportDeleteModal.vue'
import ReportDetailDrawer from '@/components/report/ReportDetailDrawer.vue'
import ReportDownloadModal from '@/components/report/ReportDownloadModal.vue'
import ReportDownloadApplicationModal from '@/components/report/ReportDownloadApplicationModal.vue'
import ReportDownloadApprovalDrawer from '@/components/report/ReportDownloadApprovalDrawer.vue'
import ReportFailureReasonModal from '@/components/report/ReportFailureReasonModal.vue'
import ReportGenerateModal from '@/components/report/ReportGenerateModal.vue'
import ReportQueryBar from '@/components/report/ReportQueryBar.vue'
import ReportTable from '@/components/report/ReportTable.vue'
import { useFilteredPaginatedList } from '@/composables/useFilteredPaginatedList'
import { usePagePermission } from '@/composables/usePagePermission'
import { useRoute } from 'vue-router'
import type { Report, ReportExportPolicyPreview } from '@/types/report'
import {
  createEmptyReportListFilters,
  reportListFiltersToQuery,
} from '@/utils/reportQuery'
import { triggerReportDownload } from '@/utils/reportDownload'

const generateVisible = ref(false)
const deleteVisible = ref(false)
const deletingReport = ref<Report | null>(null)
const failureReasonVisible = ref(false)
const failureReasonReport = ref<Report | null>(null)
const downloadVisible = ref(false)
const downloadReport = ref<Report | null>(null)
const downloadExportPolicy = ref<ReportExportPolicyPreview | null>(null)
const downloadApplicationId = ref<string | undefined>(undefined)
const downloadChecking = ref(false)
const applicationVisible = ref(false)
const applicationReport = ref<Report | null>(null)
const approvalVisible = ref(false)
const approvalApplicationId = ref<string | null>(null)
const detailVisible = ref(false)
const detailReport = ref<Report | null>(null)
const { canWrite } = usePagePermission()
const route = useRoute()

const {
  filterForm,
  loading,
  list: reportList,
  pagination,
  loadPage,
  handleSearch,
  handleReset,
} = useFilteredPaginatedList<Report, ReturnType<typeof createEmptyReportListFilters>>(
  async (params) => (await getReportList({ ...params, reportId: typeof route.query.reportId === 'string' ? route.query.reportId : undefined })).data,
  {
    createEmptyFilters: createEmptyReportListFilters,
    filtersToQuery: reportListFiltersToQuery,
    pageSize: 10,
  },
)

/** 站内消息 action 经 URL 带到报告列表后，自动打开对应流程。 */
watch(
  () => [route.query.approvalId, route.query.retryApplication, route.query.downloadApplication, reportList.value] as const,
  async ([approvalId, retryApplication, downloadApplication]) => {
    const reportId = typeof route.query.reportId === 'string' ? route.query.reportId : ''
    const report = reportList.value.find((item) => item.reportId === reportId)
    if (typeof approvalId === 'string' && approvalId) {
      approvalApplicationId.value = approvalId
      approvalVisible.value = true
      return
    }
    if (retryApplication === '1' && report) {
      try {
        downloadExportPolicy.value = (await getReportDownloadStatus(report.reportId)).data.exportPolicy
      } catch {
        message.error('获取下载策略失败')
        return
      }
      applicationReport.value = report
      applicationVisible.value = true
      return
    }
    if (typeof downloadApplication === 'string' && downloadApplication && report) {
      const format = route.query.format === 'word' || route.query.format === 'html' ? route.query.format : 'pdf'
      const response = await createReportDownload(report.reportId, {
        format,
        includeEvidenceChain: route.query.includeEvidenceChain === 'true',
        applicationId: downloadApplication,
      }, report.reportName)
      triggerReportDownload(response.data.downloadUrl, response.data.fileName)
    }
  },
  { deep: true },
)

/** 打开删除确认弹窗 */
function openDeleteModal(report: Report) {
  if (!canWrite('/reports')) return
  deletingReport.value = report
  deleteVisible.value = true
}

/** 打开失败原因弹窗 */
function openFailureReasonModal(report: Report) {
  failureReasonReport.value = report
  failureReasonVisible.value = true
}

/** 打开报告详情抽屉 */
function openDetailDrawer(report: Report) {
  detailReport.value = report
  detailVisible.value = true
}

/** 点击下载：先查审批状态，未通过则提示提交申请，已通过或无需审批则打开下载弹窗 */
async function handleDownloadClick(report: Report) {
  if (downloadChecking.value) return

  downloadChecking.value = true
  try {
    const res = await getReportDownloadStatus(report.reportId)
    const { requiresApproval, approvalState, exportPolicy, applicationId } = res.data
    downloadExportPolicy.value = exportPolicy

    if (requiresApproval && approvalState !== 'approved') {
      if (!canWrite('/reports')) {
        message.warning('下载需要审批，当前账号无提交申请权限')
        return
      }
      if (approvalState === 'pending_review') {
        message.warning('下载申请审批中，请稍后再试')
        return
      }

      if (approvalState === 'rejected') {
        applicationReport.value = report
        applicationVisible.value = true
        return
      }

      applicationReport.value = report
      applicationVisible.value = true
      return
    }

    downloadReport.value = report
    downloadApplicationId.value = applicationId
    downloadVisible.value = true
  } catch {
    message.error('获取下载信息失败')
  } finally {
    downloadChecking.value = false
  }
}

/** 生成报告成功后刷新列表 */
async function onGenerateSuccess() {
  pagination.current = 1
  await loadPage()
}

/** 删除成功后更新列表；若当前页删空且非第一页则回退一页 */
async function onDeleteSuccess() {
  const deletedId = deletingReport.value?.reportId
  deletingReport.value = null
  message.success('删除成功')

  if (!deletedId) {
    await loadPage()
    return
  }

  reportList.value = reportList.value.filter((item) => item.reportId !== deletedId)
  if (typeof pagination.total === 'number' && pagination.total > 0) {
    pagination.total -= 1
  }

  if (reportList.value.length === 0 && (pagination.current ?? 1) > 1) {
    pagination.current = (pagination.current ?? 1) - 1
    await loadPage()
  }
}
</script>

<style scoped>
.page-container {
  min-height: 100%;
}
</style>
