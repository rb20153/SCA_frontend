<template>
  <a-modal
    v-model:open="visible"
    title="上传二进制"
    :confirm-loading="submitting"
    :ok-button-props="{ disabled: !hasValidFile }"
    ok-text="确定"
    cancel-text="取消"
    destroy-on-close
    @ok="handleOk"
  >
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
    <p class="upload-hint">文件上传后将由后端解析，解析完成后交付物列表会自动更新。</p>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { InboxOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { uploadProjectBinaryDeliverable } from '@/api/project'
import { useSingleFileUpload } from '@/composables/useSingleFileUpload'
import { toAcceptAttribute } from '@/utils/fileUpload'
import { BINARY_DELIVERABLE_EXTENSIONS } from '@/utils/projectDeliverableDisplay'

const visible = defineModel<boolean>('open', { required: true })

const props = defineProps<{
  projectId: string
}>()

const submitting = ref(false)

const acceptAttribute = computed(() => toAcceptAttribute(BINARY_DELIVERABLE_EXTENSIONS))

const { fileList, hasValidFile, handleBeforeUpload, clearFile, getSelectedFile } =
  useSingleFileUpload({
    allowedExtensions: BINARY_DELIVERABLE_EXTENSIONS,
    invalidExtensionMessage: '仅支持 .a、.so、.dll 格式的二进制文件',
  })

/** 提交二进制上传请求；成功后关闭弹窗，不刷新列表 */
async function handleOk() {
  const file = getSelectedFile()
  if (!file) {
    message.warning('请上传二进制文件')
    return Promise.reject()
  }

  submitting.value = true
  try {
    await uploadProjectBinaryDeliverable(props.projectId, { file })
    message.success('二进制文件已提交，后台解析中')
    visible.value = false
  } finally {
    submitting.value = false
  }
}

watch(
  () => visible.value,
  (open) => {
    if (!open) {
      clearFile()
    }
  },
)
</script>

<style scoped>
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
