<template>
  <div class="page-container report-template-editor-page">
    <a-alert
      v-if="isReadonly"
      type="info"
      show-icon
      message="系统默认模版不可操作"
      class="report-template-editor-page__readonly-alert"
    />

    <div v-if="!isReadonly" class="page-actions">
      <a-button type="primary" :loading="saving" @click="handleSaveTemplate">
        保存模板
      </a-button>
    </div>

    <PageNavTabs
      v-model:active-key="activeTab"
      :tabs="REPORT_TEMPLATE_EDITOR_TABS"
    />

    <PageLoading :loading="loading" class="report-template-editor-page__body">
      <a-result
        v-if="!loading && loadFailed"
        status="warning"
        title="无法加载模板"
        sub-title="未找到该模板或已被删除，请返回列表重试"
      >
        <template #extra>
          <a-button type="primary" @click="router.push('/reports/templates')">
            返回模板列表
          </a-button>
        </template>
      </a-result>

      <template v-else-if="detailReady">
        <div v-show="activeTab === 'content'" class="report-template-editor-page__content">
          <a-card :bordered="false" class="basic-info-card">
            <ReportTemplateBasicInfoForm
              v-model="form"
              :bound-project-name="boundProjectName"
              :readonly="isReadonly"
            />
          </a-card>

          <ReportTemplateContentPanel
            v-model:markdown-content="markdownContent"
            :variables="templateVariables"
            :template-name="form.templateName"
            :readonly="isReadonly"
          />
        </div>

        <ReportTemplateExportPanel
          ref="exportPanelRef"
          v-show="activeTab === 'export'"
          v-model="exportSettings"
          :readonly="isReadonly"
        />
      </template>
    </PageLoading>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  getNewReportTemplateEditorDetail,
  getReportTemplateDetail,
  saveReportTemplate,
} from '@/api/reportTemplate'
import PageLoading from '@/components/common/PageLoading.vue'
import PageNavTabs from '@/components/common/PageNavTabs.vue'
import ReportTemplateBasicInfoForm from '@/components/report/ReportTemplateBasicInfoForm.vue'
import ReportTemplateContentPanel from '@/components/report/ReportTemplateContentPanel.vue'
import ReportTemplateExportPanel from '@/components/report/ReportTemplateExportPanel.vue'
import type {
  NewReportTemplateDraftParams,
  ReportTemplateDetail,
  ReportTemplateEditorForm,
  ReportTemplateExportSettings,
  SaveReportTemplateParams,
} from '@/types/reportTemplate'
import {
  REPORT_TEMPLATE_EDITOR_TABS,
  createEmptyReportTemplateEditorForm,
} from '@/utils/reportTemplateDisplay'
import { validateReportTemplateBeforeSave } from '@/utils/reportTemplateEditorValidate'
import {
  cloneReportTemplateExportSettings,
  createEmptyReportTemplateExportSettings,
} from '@/utils/reportTemplateExportDisplay'
import { convertMarkdownVariablesToEnglish } from '@/utils/reportTemplateMarkdown'

type ReportTemplateEditorTabKey = 'content' | 'export'

interface HistoryDraftState {
  draft?: NewReportTemplateDraftParams
}

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const saving = ref(false)
const loadFailed = ref(false)
const isSystemTemplate = ref(false)
const activeTab = ref<ReportTemplateEditorTabKey>('content')
const boundProjectName = ref<string | undefined>(undefined)
const exportPanelRef = ref<InstanceType<typeof ReportTemplateExportPanel> | null>(null)

let form = reactive<ReportTemplateEditorForm>(createEmptyReportTemplateEditorForm())
const markdownContent = ref('')
const templateVariables = ref<ReportTemplateDetail['variables']>([])
const exportSettings = ref<ReportTemplateExportSettings>(createEmptyReportTemplateExportSettings())

/** 当前编辑的模板 ID */
const templateId = computed(() => String(route.params.templateId ?? ''))

/** 是否为新建未保存态 */
const isNewTemplate = computed(() => templateId.value === 'new')

/** 系统内置模板只读查看，不可编辑与保存 */
const isReadonly = computed(() => isSystemTemplate.value)

/** 详情已加载且可展示编辑区 */
const detailReady = computed(() => !loading.value && !loadFailed.value)

/** 从路由 history.state 读取新建弹窗带入的草稿 */
function readNewTemplateDraft(): NewReportTemplateDraftParams | null {
  const state = history.state as HistoryDraftState | null
  const draft = state?.draft
  if (!draft?.templateName?.trim()) {
    return null
  }
  return {
    templateName: draft.templateName.trim(),
    copyFromTemplateId: draft.copyFromTemplateId,
  }
}

/** 将详情 API 数据写入基本信息表单与 Markdown 工作区 */
function applyDetailToForm(detail: ReportTemplateDetail) {
  isSystemTemplate.value = detail.isSystem
  form.templateName = detail.templateName
  form.version = detail.version
  form.outputFormat = detail.outputFormat
  form.visibility = detail.visibility
  form.projectId = detail.projectId
  form.isDefault = detail.isDefault
  boundProjectName.value = detail.projectName
  markdownContent.value = detail.markdownContent
  templateVariables.value = detail.variables
  exportSettings.value = cloneReportTemplateExportSettings(detail.exportSettings)
}

/** 组装保存请求体（Markdown 变量转为英文 varKey） */
function buildSaveParams(): SaveReportTemplateParams {
  return {
    templateName: form.templateName.trim(),
    version: form.version.trim(),
    outputFormat: form.outputFormat!,
    visibility: form.visibility!,
    projectId: form.visibility === 'project' ? form.projectId : undefined,
    isDefault: form.isDefault ?? false,
    markdownContent: convertMarkdownVariablesToEnglish(
      markdownContent.value,
      templateVariables.value,
    ),
    exportSettings: {
      sensitiveFields: [...exportSettings.value.sensitiveFields],
      allowedFormats: [...exportSettings.value.allowedFormats],
      exportRequiresApproval: exportSettings.value.exportRequiresApproval,
      watermarkEnabled: exportSettings.value.watermarkEnabled,
      watermarkContent: exportSettings.value.watermarkContent,
      downloadScope: exportSettings.value.downloadScope,
      linkValidity: exportSettings.value.linkValidity,
      auditDownloadUser: exportSettings.value.auditDownloadUser,
      auditDownloadIp: exportSettings.value.auditDownloadIp,
    },
  }
}

/** 校验通过后提交保存模板请求，成功后返回模板列表 */
async function handleSaveTemplate() {
  const validationError = validateReportTemplateBeforeSave({
    form,
    markdownContent: markdownContent.value,
    exportSettings: exportSettings.value,
  })
  if (validationError) {
    message.warning(validationError)
    if (validationError.includes('水印')) {
      activeTab.value = 'export'
    }
    return
  }

  const exportValid = await exportPanelRef.value?.validateExportSettings()
  if (!exportValid) {
    message.warning('请填写水印内容')
    activeTab.value = 'export'
    return
  }

  saving.value = true
  try {
    const payload = buildSaveParams()
    await saveReportTemplate(templateId.value, payload)
    message.success('模板已保存')
    await router.push('/reports/templates')
  } finally {
    saving.value = false
  }
}

/** 根据路由 templateId 拉取模板详情并回填表单 */
async function fetchTemplateDetail() {
  const id = templateId.value
  if (!id) {
    loadFailed.value = true
    loading.value = false
    return
  }

  loading.value = true
  loadFailed.value = false
  isSystemTemplate.value = false

  try {
    if (isNewTemplate.value) {
      const draft = readNewTemplateDraft()
      if (!draft) {
        loadFailed.value = true
        Object.assign(form, createEmptyReportTemplateEditorForm())
        boundProjectName.value = undefined
        markdownContent.value = ''
        templateVariables.value = []
        exportSettings.value = createEmptyReportTemplateExportSettings()
        return
      }

      const res = await getNewReportTemplateEditorDetail(draft)
      applyDetailToForm(res.data)
      return
    }

    const res = await getReportTemplateDetail(id)
    if (!res.data) {
      loadFailed.value = true
      Object.assign(form, createEmptyReportTemplateEditorForm())
      boundProjectName.value = undefined
      markdownContent.value = ''
      templateVariables.value = []
      exportSettings.value = createEmptyReportTemplateExportSettings()
      return
    }

    applyDetailToForm(res.data)
  } finally {
    loading.value = false
  }
}

watch(
  () => route.params.templateId,
  () => {
    void fetchTemplateDetail()
  },
)

onMounted(() => {
  void fetchTemplateDetail()
})
</script>

<style scoped>
.page-container {
  min-height: calc(100vh - 56px - 48px);
  display: flex;
  flex-direction: column;
}

.report-template-editor-page__readonly-alert {
  margin-bottom: 16px;
  flex-shrink: 0;
}

.page-actions {
  display: flex;
  justify-content: flex-start;
  gap: 8px;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.report-template-editor-page__body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.report-template-editor-page__body :deep(.page-loading),
.report-template-editor-page__body :deep(.page-loading .ant-spin-container),
.report-template-editor-page__body :deep(.page-loading__body) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.report-template-editor-page__content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.basic-info-card {
  flex-shrink: 0;
}
</style>
