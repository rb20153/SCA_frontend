<template>
  <a-drawer
    v-model:open="visible"
    title="查看报告"
    placement="right"
    :width="840"
    destroy-on-close
    :footer="null"
    :body-style="drawerBodyStyle"
  >
    <PageLoading :loading="loading" class="report-detail-loading">
      <div v-if="detail" class="report-detail-body">
        <a-descriptions :column="2" bordered size="small" class="report-detail-desc detail-desc">
          <a-descriptions-item label="报告名称" :span="2">
            <DetailText :text="detail.reportName" />
          </a-descriptions-item>
          <a-descriptions-item label="关联项目">
            <DetailText :text="detail.projectName" />
          </a-descriptions-item>
          <a-descriptions-item label="模板">
            <DetailText :text="detail.templateName" />
          </a-descriptions-item>
          <a-descriptions-item label="生成时间" :span="2">
            {{ formatReportDateTime(detail.generatedAt) }}
          </a-descriptions-item>
        </a-descriptions>

        <div class="report-preview">
          <span class="report-preview-placeholder">报告预览占位（PDF / HTML Viewer）</span>
        </div>
      </div>
    </PageLoading>
  </a-drawer>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { getReportDetail } from '@/api/report'
import DetailText from '@/components/common/DetailText.vue'
import PageLoading from '@/components/common/PageLoading.vue'
import type { ReportDetail } from '@/types/report'
import { formatReportDateTime } from '@/utils/reportDisplay'

const props = defineProps<{
  reportId: string | null
}>()

const visible = defineModel<boolean>('open', { required: true })

const drawerBodyStyle = {
  padding: '16px',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  height: 'calc(100% - 55px)',
} as const

const loading = ref(false)
const detail = ref<ReportDetail | null>(null)

/** 打开抽屉时按 ID 拉取报告详情 */
async function fetchDetail(reportId: string) {
  loading.value = true
  detail.value = null
  try {
    const res = await getReportDetail(reportId)
    detail.value = res.data
  } finally {
    loading.value = false
  }
}

watch(
  () => [visible.value, props.reportId] as const,
  ([open, reportId]) => {
    if (open && reportId) {
      fetchDetail(reportId)
    }
    if (!open) {
      detail.value = null
    }
  },
)
</script>

<style scoped>
.report-detail-loading {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.report-detail-loading :deep(.ant-spin-container),
.report-detail-loading :deep(.page-loading__body) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.report-detail-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.report-detail-desc {
  flex-shrink: 0;
  margin-bottom: 0;
}

.detail-desc :deep(.ant-descriptions-item-content) {
  word-break: break-word;
  overflow-wrap: anywhere;
}

.report-preview {
  flex: 1;
  min-height: 200px;
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
}

.report-preview-placeholder {
  color: rgba(0, 0, 0, 0.45);
  font-size: 14px;
}
</style>
