<template>
  <a-modal
    v-model:open="visible"
    title="导入离线漏洞包"
    :confirm-loading="submitting"
    ok-text="确定"
    cancel-text="取消"
    destroy-on-close
    @ok="handleOk"
  >
    <a-form layout="vertical">
      <a-form-item label="来源标签" required>
        <a-input
          v-model:value="sourceTag"
          placeholder="例如：离线-NVD-202605"
          allow-clear
        />
      </a-form-item>

      <a-form-item label="漏洞包" required>
        <a-upload-dragger
          :file-list="fileList"
          :before-upload="handleBeforeUpload"
          :max-count="1"
          accept=".json,.csv,.xml"
          @remove="handleRemove"
        >
          <p class="upload-icon">
            <InboxOutlined />
          </p>
          <p class="upload-title">点击或拖拽上传 JSON / CSV / XML</p>
        </a-upload-dragger>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { InboxOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import type { UploadFile } from 'ant-design-vue'
import type { RcFile } from 'ant-design-vue/es/vc-upload/interface'
import { importOfflineVulnPackage } from '@/api/knowledge'
import { createSingleUploadFileList, getUploadOriginFile } from '@/utils/fileUpload'

const visible = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  success: []
}>()

const submitting = ref(false)
const sourceTag = ref('')
const fileList = ref<UploadFile[]>([])

/** 重置表单 */
function resetForm() {
  sourceTag.value = ''
  fileList.value = []
}

/** 拦截自动上传，构造带 originFileObj 的 UploadFile 供提交读取 */
function handleBeforeUpload(file: RcFile) {
  fileList.value = createSingleUploadFileList(file)
  return false
}

/** 移除已选漏洞包 */
function handleRemove() {
  fileList.value = []
}

/** 校验后提交导入请求 */
async function handleOk() {
  const tag = sourceTag.value.trim()
  if (!tag) {
    message.warning('请输入来源标签')
    return Promise.reject()
  }

  const file = getUploadOriginFile(fileList.value)
  if (!file) {
    message.warning('请上传漏洞包文件')
    return Promise.reject()
  }

  submitting.value = true
  try {
    await importOfflineVulnPackage({ sourceTag: tag, file })
    message.success('离线漏洞包导入成功')
    visible.value = false
    emit('success')
  } finally {
    submitting.value = false
  }
}

watch(
  () => visible.value,
  (open) => {
    if (!open) {
      resetForm()
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
