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
          @delete="openDeleteModal"
          @failure-reason="openFailureReasonModal"
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
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import { getReportList } from '@/api/report'
import ListEmptyGuide from '@/components/common/ListEmptyGuide.vue'
import PageLoading from '@/components/common/PageLoading.vue'
import ReportCreateBar from '@/components/report/ReportCreateBar.vue'
import ReportDeleteModal from '@/components/report/ReportDeleteModal.vue'
import ReportFailureReasonModal from '@/components/report/ReportFailureReasonModal.vue'
import ReportGenerateModal from '@/components/report/ReportGenerateModal.vue'
import ReportQueryBar from '@/components/report/ReportQueryBar.vue'
import ReportTable from '@/components/report/ReportTable.vue'
import { useFilteredPaginatedList } from '@/composables/useFilteredPaginatedList'
import type { Report } from '@/types/report'
import {
  createEmptyReportListFilters,
  reportListFiltersToQuery,
} from '@/utils/reportQuery'

const generateVisible = ref(false)
const deleteVisible = ref(false)
const deletingReport = ref<Report | null>(null)
const failureReasonVisible = ref(false)
const failureReasonReport = ref<Report | null>(null)

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
  deletingReport.value = report
  deleteVisible.value = true
}

/** 打开失败原因弹窗 */
function openFailureReasonModal(report: Report) {
  failureReasonReport.value = report
  failureReasonVisible.value = true
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
