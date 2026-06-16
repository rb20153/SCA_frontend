<template>
  <div class="deliverable-inline-form">
    <template v-if="deliverableKind === null">
      <p class="type-picker-hint">请选择交付物类型</p>
      <div class="type-options">
        <button type="button" class="type-option" @click="selectKind('source')">
          <span class="type-option__title">添加源码交付物</span>
          <span class="type-option__desc">从三方仓库拉取或上传源码包（.zip / .tar.gz）</span>
        </button>
        <button type="button" class="type-option" @click="selectKind('binary')">
          <span class="type-option__title">上传二进制</span>
          <span class="type-option__desc">上传 .a / .so / .dll 等二进制交付文件</span>
        </button>
        <button type="button" class="type-option type-option--muted" @click="selectKind('later')">
          <span class="type-option__title">稍后上传</span>
          <span class="type-option__desc">暂无交付物文件，创建后在项目详情页上传</span>
        </button>
      </div>
    </template>

    <template v-else>
      <div class="type-switch-bar">
        <span class="type-switch-bar__label">{{ kindLabel }}</span>
        <a-button type="link" size="small" @click="resetKind">重新选择类型</a-button>
      </div>

      <template v-if="deliverableKind === 'source'">
        <SourceIngestForm ref="ingestFormRef" v-model="sourceForm" />

        <a-form layout="vertical" class="scan-path-form">
          <a-form-item label="扫描路径前缀">
            <a-input
              v-model:value="scanPathPrefix"
              placeholder="留空表示整包；示例：src/flight-control/"
              allow-clear
            />
          </a-form-item>
        </a-form>
      </template>

      <template v-else-if="deliverableKind === 'binary'">
        <a-upload-dragger
          :file-list="fileList"
          :before-upload="handleBeforeUpload"
          :max-count="1"
          :accept="acceptAttribute"
          @remove="clearFile"
        >
          <p class="upload-icon">
            <InboxOutlined />
          </p>
          <p class="upload-title">点击或拖拽上传 .a / .so / .dll</p>
        </a-upload-dragger>
        <p class="upload-hint">文件将在创建项目时一并提交，由后端解析。</p>
      </template>

      <template v-else-if="deliverableKind === 'later'">
        <a-alert
          type="info"
          show-icon
          message="已选择稍后上传"
          description="项目创建后，可在项目详情 · 交付物 Tab 中上传源码或二进制文件。"
        />
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { InboxOutlined } from '@ant-design/icons-vue'
import SourceIngestForm from '@/components/common/SourceIngestForm.vue'
import { useSingleFileUpload } from '@/composables/useSingleFileUpload'
import type { CollectedProjectDeliverable } from '@/types/project'
import type { SourceIngestFormState } from '@/types/sourceIngest'
import { toAcceptAttribute } from '@/utils/fileUpload'
import { BINARY_DELIVERABLE_EXTENSIONS } from '@/utils/projectDeliverableDisplay'
import { createDefaultSourceIngestForm, validateSourceIngestForm } from '@/utils/sourceIngest'

type DeliverableKind = 'source' | 'binary' | 'later'

const KIND_LABEL: Record<DeliverableKind, string> = {
  source: '源码交付物',
  binary: '二进制交付物',
  later: '稍后上传',
}

const emit = defineEmits<{
  'valid-change': [valid: boolean]
}>()

const deliverableKind = ref<DeliverableKind | null>(null)
const scanPathPrefix = ref('')
const sourceForm = reactive<SourceIngestFormState>(createDefaultSourceIngestForm())

const ingestFormRef = ref<InstanceType<typeof SourceIngestForm> | null>(null)

const acceptAttribute = computed(() => toAcceptAttribute(BINARY_DELIVERABLE_EXTENSIONS))

/** 当前选中类型的展示文案 */
const kindLabel = computed(() => {
  if (deliverableKind.value === null) {
    return ''
  }
  return KIND_LABEL[deliverableKind.value]
})

const { fileList, hasValidFile, handleBeforeUpload, clearFile, getSelectedFile } =
  useSingleFileUpload({
    allowedExtensions: BINARY_DELIVERABLE_EXTENSIONS,
    invalidExtensionMessage: '仅支持 .a、.so、.dll 格式的二进制文件',
  })

/** 当前内联表单是否满足提交条件 */
const isValid = computed(() => {
  if (deliverableKind.value === null) {
    return false
  }
  if (deliverableKind.value === 'later') {
    return true
  }
  if (deliverableKind.value === 'binary') {
    return hasValidFile.value
  }
  const packageFile =
    sourceForm.sourceMode === 'upload-source-package'
      ? ingestFormRef.value?.getPackageFile()
      : undefined
  return validateSourceIngestForm(sourceForm, packageFile).valid
})

/** 选择交付物类型并展示对应表单 */
function selectKind(kind: DeliverableKind) {
  deliverableKind.value = kind
}

/** 返回类型选择并重置当前表单 */
function resetKind() {
  deliverableKind.value = null
  Object.assign(sourceForm, createDefaultSourceIngestForm())
  scanPathPrefix.value = ''
  ingestFormRef.value?.resetUpload()
  clearFile()
}

/** 重置为初始类型选择状态 */
function reset() {
  resetKind()
}

/** 组装待提交的交付物列表（稍后上传时返回空数组） */
function buildDeliverables(): CollectedProjectDeliverable[] {
  if (deliverableKind.value === 'later') {
    return []
  }
  const item = buildDeliverable()
  return item ? [item] : []
}

/** 组装当前交付物数据供创建项目提交 */
function buildDeliverable(): CollectedProjectDeliverable | null {
  if (!isValid.value || deliverableKind.value === null || deliverableKind.value === 'later') {
    return null
  }

  if (deliverableKind.value === 'binary') {
    const file = getSelectedFile()
    if (!file) {
      return null
    }
    return { type: 'binary', data: { file } }
  }

  const packageFile =
    sourceForm.sourceMode === 'upload-source-package'
      ? ingestFormRef.value?.getPackageFile()
      : undefined

  return {
    type: 'source',
    data: {
      ...sourceForm,
      scanPathPrefix: scanPathPrefix.value.trim() || undefined,
      packageFile,
    },
  }
}

/** 校验失败时的提示文案 */
function getValidationMessage(): string {
  if (deliverableKind.value === null) {
    return '请选择交付物类型'
  }
  if (deliverableKind.value === 'later') {
    return ''
  }
  if (deliverableKind.value === 'binary') {
    return '请上传二进制文件'
  }
  const packageFile =
    sourceForm.sourceMode === 'upload-source-package'
      ? ingestFormRef.value?.getPackageFile()
      : undefined
  const validation = validateSourceIngestForm(sourceForm, packageFile)
  return validation.valid ? '' : validation.message
}

/** 同步校验状态到向导父组件，驱动「确认创建」按钮 */
watch(
  isValid,
  (valid) => {
    emit('valid-change', valid)
  },
  { immediate: true },
)

/** 对外暴露校验状态，供向导父组件读取 */
function getIsValid(): boolean {
  return isValid.value
}

defineExpose({
  getIsValid,
  buildDeliverable,
  buildDeliverables,
  reset,
  getValidationMessage,
})
</script>

<style scoped>
.type-picker-hint {
  margin: 0 0 16px;
  color: rgba(0, 0, 0, 0.45);
  font-size: 14px;
}

.type-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.type-option {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  width: 100%;
  padding: 12px 16px;
  text-align: left;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.type-option:hover {
  border-color: #1677ff;
  box-shadow: 0 2px 8px rgba(22, 119, 255, 0.12);
}

.type-option--muted .type-option__title {
  color: rgba(0, 0, 0, 0.65);
}

.type-option__title {
  font-size: 14px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.88);
  line-height: 22px;
}

.type-option__desc {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  line-height: 20px;
}

.type-switch-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.type-switch-bar__label {
  font-size: 14px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.88);
}

.scan-path-form {
  margin-top: 8px;
}

.upload-icon {
  margin: 0 0 8px;
  font-size: 32px;
  color: #1677ff;
}

.upload-title {
  margin: 0;
  color: rgba(0, 0, 0, 0.65);
}

.upload-hint {
  margin: 12px 0 0;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.45);
  line-height: 1.6;
}
</style>
