<template>
  <a-modal
    v-model:open="visible"
    title="创建开源风险检测任务"
    width="720px"
    destroy-on-close
    :confirm-loading="submitting"
    :ok-button-props="{ disabled: optionsLoading || !canSubmit }"
    ok-text="创建任务"
    cancel-text="取消"
    @ok="handleSubmit"
  >
    <a-spin :spinning="optionsLoading">
      <a-alert
        type="info"
        show-icon
        class="risk-intro-alert"
        message="任务将自动依次执行：① 组件识别 → ② 漏洞匹配 → ③ 生成 SBOM 清单。完成后可在任务列表点击「详情」查看结果。"
      />

      <a-form layout="vertical" class="risk-form">
        <a-form-item label="任务名称" required>
          <a-input
            v-model:value="form.taskName"
            placeholder="请输入任务名称"
            allow-clear
          />
        </a-form-item>

        <a-form-item label="关联项目" required>
          <a-select
            v-model:value="form.projectId"
            placeholder="请选择"
            show-search
            option-filter-prop="label"
            :options="projectOptions"
            class="risk-select"
          />
        </a-form-item>

        <a-form-item label="数据来源" required>
          <a-radio-group
            v-model:value="form.dataSource"
            :options="RISK_DATA_SOURCE_OPTIONS"
            @change="onDataSourceChange"
          />
        </a-form-item>

        <template v-if="form.dataSource === 'project-scan'">
          <a-form-item label="扫描范围">
            <a-select
              v-model:value="form.scanScope"
              :options="RISK_SCAN_SCOPE_OPTIONS"
              class="risk-select"
            />
          </a-form-item>

          <a-form-item label="漏洞库版本" required>
            <a-select
              v-model:value="form.vulnDbVersion"
              placeholder="请选择"
              :options="vulnDbOptions"
              class="risk-select"
            />
          </a-form-item>

          <a-form-item label="依赖深度">
            <a-select
              v-model:value="form.dependencyDepth"
              :options="RISK_DEPENDENCY_DEPTH_OPTIONS"
              class="risk-select"
            />
          </a-form-item>
        </template>

        <template v-else>
          <a-form-item label="SBOM 文件" required>
            <a-upload-dragger
              :file-list="sbomFileList"
              :before-upload="handleBeforeUpload"
              :max-count="1"
              accept=".json,.xml,.spdx"
              @remove="handleRemoveSbom"
            >
              <p class="upload-icon">
                <InboxOutlined />
              </p>
              <p class="upload-title">点击或拖拽上传 SPDX / CycloneDX 格式文件</p>
            </a-upload-dragger>
          </a-form-item>
          <p class="sbom-hint">
            上传后将直接解析组件清单并自动进行漏洞匹配，无需扫描项目源码。
          </p>
        </template>
      </a-form>
    </a-spin>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { InboxOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import type { UploadFile } from 'ant-design-vue'
import type { RcFile } from 'ant-design-vue/es/vc-upload/interface'
import {
  createDetectTask,
  getDetectTaskProjectOptions,
  getRiskDetectVulnDbVersions,
} from '@/api/detect'
import type { DetectTask, DetectTaskProjectOption, VulnDbVersionOption } from '@/types/detect'
import {
  RISK_DATA_SOURCE_OPTIONS,
  RISK_DEPENDENCY_DEPTH_OPTIONS,
  RISK_SCAN_SCOPE_OPTIONS,
  createDefaultRiskTaskForm,
} from '@/utils/taskCreate'

const visible = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  success: [task: DetectTask]
}>()

const SBOM_ALLOWED_EXTENSIONS = ['.json', '.xml', '.spdx'] as const

const optionsLoading = ref(false)
const submitting = ref(false)
const projects = ref<DetectTaskProjectOption[]>([])
const vulnDbVersions = ref<VulnDbVersionOption[]>([])
const sbomFileList = ref<UploadFile[]>([])

const form = reactive(createDefaultRiskTaskForm())

/** 项目下拉选项 */
const projectOptions = computed(() =>
  projects.value.map((item) => ({
    value: item.projectId,
    label: item.projectName,
  })),
)

/** 漏洞库版本下拉选项 */
const vulnDbOptions = computed(() =>
  vulnDbVersions.value.map((item) => ({
    value: item.version,
    label: item.label,
  })),
)

/** 是否已选择有效 SBOM 文件 */
const hasSbomFile = computed(() => {
  const file = sbomFileList.value[0]?.originFileObj
  return file instanceof File
})

/** 必填项校验 */
const canSubmit = computed(() => {
  if (!form.taskName.trim() || !form.projectId.trim()) return false
  if (form.dataSource === 'project-scan') {
    return form.vulnDbVersion.trim().length > 0
  }
  return hasSbomFile.value
})

/** 校验 SBOM 文件扩展名是否为 SPDX / CycloneDX 常用格式 */
function isAllowedSbomFile(file: RcFile): boolean {
  const lowerName = file.name.toLowerCase()
  return SBOM_ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext))
}

/** 拉取项目与漏洞库版本选项 */
async function fetchOptions() {
  optionsLoading.value = true
  try {
    const [projectRes, vulnRes] = await Promise.all([
      getDetectTaskProjectOptions(),
      getRiskDetectVulnDbVersions(),
    ])
    projects.value = projectRes.data
    vulnDbVersions.value = vulnRes.data
    if (!form.vulnDbVersion && vulnRes.data.length > 0) {
      form.vulnDbVersion = vulnRes.data[0].version
    }
  } finally {
    optionsLoading.value = false
  }
}

/** 重置表单与上传列表 */
function resetForm() {
  Object.assign(form, createDefaultRiskTaskForm())
  sbomFileList.value = []
}

/** 切换数据来源时清空 SBOM 上传状态 */
function onDataSourceChange() {
  sbomFileList.value = []
}

/** 拦截自动上传，仅保留本地文件引用 */
function handleBeforeUpload(file: RcFile) {
  if (!isAllowedSbomFile(file)) {
    message.error('仅支持 SPDX / CycloneDX 格式（.json、.xml、.spdx）')
    return false
  }

  sbomFileList.value = [
    {
      uid: file.uid,
      name: file.name,
      status: 'done',
      originFileObj: file,
    },
  ]
  return false
}

/** 移除已选 SBOM 文件 */
function handleRemoveSbom() {
  sbomFileList.value = []
}

/** 提交创建开源风险检测任务；校验失败时阻止弹窗关闭 */
async function handleSubmit() {
  if (!canSubmit.value) {
    return Promise.reject()
  }

  submitting.value = true
  try {
    const sbomFile = sbomFileList.value[0]?.originFileObj
    const isImportSbom = form.dataSource === 'import-sbom'

    const res = await createDetectTask({
      taskType: 'open-source-risk',
      taskName: form.taskName.trim(),
      projectId: form.projectId,
      dataSource: form.dataSource,
      ...(isImportSbom
        ? { sbomFile: sbomFile instanceof File ? sbomFile : undefined }
        : {
            scanScope: form.scanScope,
            vulnDbVersion: form.vulnDbVersion,
            dependencyDepth: form.dependencyDepth,
          }),
    })
    message.success('开源风险检测任务已创建')
    visible.value = false
    emit('success', res.data)
  } finally {
    submitting.value = false
  }
}

watch(
  () => visible.value,
  (open) => {
    if (open) {
      resetForm()
      fetchOptions()
    }
  },
)
</script>

<style scoped>
.risk-intro-alert {
  margin-bottom: 16px;
}

.risk-form {
  margin-top: 8px;
}

.risk-select {
  width: 100%;
  max-width: 360px;
}

.upload-icon {
  margin-bottom: 8px;
  font-size: 32px;
  color: #1677ff;
}

.upload-title {
  margin: 0;
  color: rgba(0, 0, 0, 0.65);
}

.sbom-hint {
  margin: -8px 0 0;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.45);
  line-height: 1.6;
}
</style>
