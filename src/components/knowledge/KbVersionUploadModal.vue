<template>
  <a-modal
    v-model:open="visible"
    title="上传更新包"
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
      :accept="packageAccept"
      @remove="clearFile"
    >
      <p class="upload-icon">
        <InboxOutlined />
      </p>
      <p class="upload-title">点击或拖拽上传 zip / 7z / tar.gz 更新包</p>
    </a-upload-dragger>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { InboxOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { uploadKbVersionPackage } from '@/api/knowledge'
import { useSingleFileUpload } from '@/composables/useSingleFileUpload'
import { toAcceptAttribute } from '@/utils/fileUpload'
import { SOURCE_PACKAGE_EXTENSIONS } from '@/utils/sourceIngest'

const visible = defineModel<boolean>('open', { required: true })

const props = defineProps<{
  kbProjectId: string
}>()

const submitting = ref(false)
const packageAccept = computed(() => toAcceptAttribute(SOURCE_PACKAGE_EXTENSIONS))

const { fileList, hasValidFile, handleBeforeUpload, clearFile, getSelectedFile } =
  useSingleFileUpload({
    allowedExtensions: SOURCE_PACKAGE_EXTENSIONS,
    invalidExtensionMessage: '仅支持 zip、7z、tar.gz 格式的更新包',
  })

/** 提交更新包上传；成功后关闭弹窗，不刷新列表 */
async function handleOk() {
  const file = getSelectedFile()
  if (!file) {
    message.warning('请上传更新包')
    return Promise.reject()
  }

  submitting.value = true
  try {
    await uploadKbVersionPackage(props.kbProjectId, { file })
    message.success('更新包已提交，后台处理中')
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
</style>
