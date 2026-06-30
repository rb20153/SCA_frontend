<template>
  <div class="sbom-export-panel">
    <a-row :gutter="16" class="sbom-export-row">
      <a-col :span="6" class="sbom-export-col">
        <a-card :bordered="false" title="导出配置" class="sbom-export-card">
          <a-form layout="vertical" class="export-config-form">
            <a-form-item label="标准格式">
              <a-radio-group v-model:value="standardFormat" class="format-radio-group">
                <a-radio
                  v-for="option in OPEN_SOURCE_RISK_SBOM_STANDARD_FORMAT_OPTIONS"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </a-radio>
              </a-radio-group>
            </a-form-item>

            <a-form-item label="文件格式">
              <a-radio-group v-model:value="fileFormat" class="format-radio-group">
                <a-radio
                  v-for="option in OPEN_SOURCE_RISK_SBOM_FILE_FORMAT_OPTIONS"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </a-radio>
              </a-radio-group>
            </a-form-item>
          </a-form>
        </a-card>
      </a-col>

      <a-col :span="18" class="sbom-export-col">
        <a-card :bordered="false" class="sbom-export-card">
          <div class="preview-toolbar">
            <span class="preview-label">输出粒度</span>
            <a-select
              v-model:value="granularity"
              :options="OPEN_SOURCE_RISK_SBOM_GRANULARITY_OPTIONS"
              class="granularity-select"
            />
          </div>

          <PageLoading :loading="loadingPreview && previewRows.length === 0">
            <RiskSbomPreviewTable
              :granularity="granularity"
              :rows="previewRows"
              :loading="loadingPreview"
              :pagination="previewPagination"
            />
          </PageLoading>
        </a-card>
      </a-col>
    </a-row>

    <div class="sbom-export-footer">
      <a-button type="primary" :loading="exporting" @click="handleExport">
        导出 SBOM
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import type { TablePaginationConfig } from 'ant-design-vue'
import { exportOpenSourceRiskSbom, getOpenSourceRiskSbomPreview } from '@/api/detect'
import PageLoading from '@/components/common/PageLoading.vue'
import RiskSbomPreviewTable from '@/components/detect/RiskSbomPreviewTable.vue'
import type {
  OpenSourceRiskSbomFileFormat,
  OpenSourceRiskSbomGranularity,
  OpenSourceRiskSbomModulePreviewRow,
  OpenSourceRiskSbomPackagePreviewRow,
  OpenSourceRiskSbomProjectPreviewRow,
  OpenSourceRiskSbomStandardFormat,
} from '@/types/detect'
import {
  OPEN_SOURCE_RISK_SBOM_FILE_FORMAT_OPTIONS,
  OPEN_SOURCE_RISK_SBOM_GRANULARITY_OPTIONS,
  OPEN_SOURCE_RISK_SBOM_PREVIEW_PAGE_SIZE,
  OPEN_SOURCE_RISK_SBOM_STANDARD_FORMAT_OPTIONS,
} from '@/utils/openSourceRiskSbomDisplay'
import { triggerReportDownload } from '@/utils/reportDownload'

const props = defineProps<{
  /** 当前任务 ID */
  taskId: string
  /** SBOM Tab 是否可见 */
  visible: boolean
}>()

const standardFormat = ref<OpenSourceRiskSbomStandardFormat>('spdx')
const fileFormat = ref<OpenSourceRiskSbomFileFormat>('json')
const granularity = ref<OpenSourceRiskSbomGranularity>('project')
const loadingPreview = ref(false)
const exporting = ref(false)
const previewRows = ref<
  Array<
    | OpenSourceRiskSbomProjectPreviewRow
    | OpenSourceRiskSbomModulePreviewRow
    | OpenSourceRiskSbomPackagePreviewRow
  >
>([])

const previewPagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: OPEN_SOURCE_RISK_SBOM_PREVIEW_PAGE_SIZE,
  total: 0,
  showSizeChanger: false,
  size: 'small',
  showTotal: (total) => `共 ${total} 条`,
  onChange: (page) => {
    previewPagination.current = page
    void fetchPreview()
  },
})

/** 拉取 SBOM 清单预览 */
async function fetchPreview() {
  if (!props.taskId) {
    previewRows.value = []
    previewPagination.total = 0
    return
  }

  loadingPreview.value = true
  try {
    const res = await getOpenSourceRiskSbomPreview(props.taskId, {
      granularity: granularity.value,
      page: previewPagination.current ?? 1,
      pageSize: previewPagination.pageSize ?? OPEN_SOURCE_RISK_SBOM_PREVIEW_PAGE_SIZE,
    })
    previewRows.value = res.data.list
    previewPagination.total = res.data.total
    previewPagination.current = res.data.page
  } finally {
    loadingPreview.value = false
  }
}

/** 按当前配置导出 SBOM 并触发下载 */
async function handleExport() {
  if (!props.taskId) {
    return
  }

  exporting.value = true
  try {
    const res = await exportOpenSourceRiskSbom(props.taskId, {
      standardFormat: standardFormat.value,
      fileFormat: fileFormat.value,
      granularity: granularity.value,
    })
    triggerReportDownload(res.data.downloadUrl, res.data.fileName)
    message.success('SBOM 文件已生成')
  } finally {
    exporting.value = false
  }
}

watch(
  () => granularity.value,
  () => {
    previewPagination.current = 1
    if (props.visible && props.taskId) {
      void fetchPreview()
    }
  },
)

watch(
  () => [props.visible, props.taskId] as const,
  ([visible, taskId]) => {
    if (visible && taskId) {
      previewPagination.current = 1
      void fetchPreview()
    }
  },
  { immediate: true },
)
</script>

<style scoped>
.sbom-export-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sbom-export-row {
  align-items: stretch;
}

.sbom-export-col {
  display: flex;
}

.sbom-export-card {
  flex: 1;
  width: 100%;
  min-height: 360px;
}

.sbom-export-card :deep(.ant-card-body) {
  display: flex;
  flex-direction: column;
  height: calc(100% - 57px);
}

.export-config-form {
  flex: 1;
}

.format-radio-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.preview-label {
  color: rgba(0, 0, 0, 0.88);
  white-space: nowrap;
}

.granularity-select {
  width: 160px;
}

.sbom-export-footer {
  display: flex;
  justify-content: flex-start;
}
</style>
