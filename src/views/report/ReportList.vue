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
    />

    <ReportDetailDrawer
      v-model:open="detailVisible"
      :report="detailReport"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Modal, message } from 'ant-design-vue'
import {
  getReportDownloadStatus,
  getReportList,
  submitReportDownloadApplication,
} from '@/api/report'
import ListEmptyGuide from '@/components/common/ListEmptyGuide.vue'
import PageLoading from '@/components/common/PageLoading.vue'
import ReportCreateBar from '@/components/report/ReportCreateBar.vue'
import ReportDeleteModal from '@/components/report/ReportDeleteModal.vue'
import ReportDetailDrawer from '@/components/report/ReportDetailDrawer.vue'
import ReportDownloadModal from '@/components/report/ReportDownloadModal.vue'
import ReportFailureReasonModal from '@/components/report/ReportFailureReasonModal.vue'
import ReportGenerateModal from '@/components/report/ReportGenerateModal.vue'
import ReportQueryBar from '@/components/report/ReportQueryBar.vue'
import ReportTable from '@/components/report/ReportTable.vue'
import { useFilteredPaginatedList } from '@/composables/useFilteredPaginatedList'
import { usePagePermission } from '@/composables/usePagePermission'
import type { Report, ReportExportPolicyPreview } from '@/types/report'
import {
  createEmptyReportListFilters,
  reportListFiltersToQuery,
} from '@/utils/reportQuery'

const generateVisible = ref(false)
const deleteVisible = ref(false)
const deletingReport = ref<Report | null>(null)
const failureReasonVisible = ref(false)
const failureReasonReport = ref<Report | null>(null)
const downloadVisible = ref(false)
const downloadReport = ref<Report | null>(null)
const downloadExportPolicy = ref<ReportExportPolicyPreview | null>(null)
const downloadChecking = ref(false)
const detailVisible = ref(false)
const detailReport = ref<Report | null>(null)
const { canWrite } = usePagePermission()

const {
  filterForm,
  loading,
  list: reportList,
  pagination,
  loadPage,
  handleSearch,
  handleReset,
} = useFilteredPaginatedList<Report, ReturnType<typeof createEmptyReportListFilters>>(
  async (params) => (await getReportList(params)).data,
  {
    createEmptyFilters: createEmptyReportListFilters,
    filtersToQuery: reportListFiltersToQuery,
    pageSize: 10,
  },
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
    const { requiresApproval, approvalState, exportPolicy } = res.data

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
        Modal.confirm({
          title: '下载申请已被驳回',
          content: '该报告下载申请已被驳回，是否重新提交申请？',
          okText: '重新提交',
          cancelText: '取消',
          onOk: async () => {
            await submitReportDownloadApplication(report.reportId)
            message.success('已重新提交下载申请')
          },
        })
        return
      }

      Modal.confirm({
        title: '需要审批',
        content: '该报告下载需要审批，是否提交申请？',
        okText: '是',
        cancelText: '否',
        onOk: async () => {
          await submitReportDownloadApplication(report.reportId)
          message.success('已提交下载申请')
        },
      })
      return
    }

    downloadReport.value = report
    downloadExportPolicy.value = exportPolicy
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
