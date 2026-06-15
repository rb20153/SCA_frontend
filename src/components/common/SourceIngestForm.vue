<template>
  <a-form layout="vertical" class="source-ingest-form">
    <a-form-item :label="sourceModeLabel" required>
      <div class="source-mode-options">
        <button
          type="button"
          class="source-mode-option"
          :class="{ 'source-mode-option--active': model.sourceMode === 'repo-pull' }"
          @click="setSourceMode('repo-pull')"
        >
          {{ SOURCE_INGEST_MODE_LABEL['repo-pull'] }}
        </button>
        <button
          type="button"
          class="source-mode-option"
          :class="{ 'source-mode-option--active': model.sourceMode === 'upload-source-package' }"
          @click="setSourceMode('upload-source-package')"
        >
          {{ SOURCE_INGEST_MODE_LABEL['upload-source-package'] }}
        </button>
      </div>
    </a-form-item>

    <template v-if="model.sourceMode === 'repo-pull'">
      <a-form-item label="仓库地址" required>
        <a-input
          v-model:value="model.repositoryUrl"
          :placeholder="repoUrlPlaceholder"
          allow-clear
        />
      </a-form-item>

      <a-form-item label="登录方式">
        <a-select
          v-model:value="model.authType"
          :options="repoAuthOptions"
          class="source-ingest-select"
        />
      </a-form-item>

      <a-alert
        v-if="model.authType === 'anonymous'"
        type="info"
        show-icon
        class="source-ingest-alert"
        message="公开仓库无需填写凭据；若为私有仓库，请改选 Token、用户名密码或 SSH Key。"
      />

      <a-form-item v-if="model.authType === 'token'" label="Access Token" required>
        <a-input-password
          v-model:value="model.accessToken"
          placeholder="GitHub / GitLab Personal Access Token"
          allow-clear
        />
      </a-form-item>

      <template v-if="model.authType === 'basic'">
        <a-form-item label="用户名" required>
          <a-input
            v-model:value="model.username"
            placeholder="仓库登录用户名"
            allow-clear
          />
        </a-form-item>
        <a-form-item label="密码" required>
          <a-input-password
            v-model:value="model.password"
            placeholder="仓库登录密码或专用访问密码"
            allow-clear
          />
        </a-form-item>
      </template>

      <template v-if="model.authType === 'ssh'">
        <a-form-item label="SSH 私钥" required>
          <a-textarea
            v-model:value="model.sshPrivateKey"
            :rows="4"
            placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
          />
        </a-form-item>
        <a-form-item label="私钥口令（可选）">
          <a-input-password
            v-model:value="model.sshPassphrase"
            placeholder="私钥未加密可留空"
            allow-clear
          />
        </a-form-item>
      </template>
    </template>

    <template v-else>
      <a-form-item label="压缩包" required>
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
          <p class="upload-title">点击或拖拽上传 zip / 7z / tar.gz</p>
        </a-upload-dragger>
      </a-form-item>
    </template>
  </a-form>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { InboxOutlined } from '@ant-design/icons-vue'
import { useSingleFileUpload } from '@/composables/useSingleFileUpload'
import type { SourceIngestFormState, SourceIngestMode } from '@/types/sourceIngest'
import { toAcceptAttribute } from '@/utils/fileUpload'
import {
  REPO_AUTH_LABEL,
  SOURCE_INGEST_MODE_LABEL,
  SOURCE_PACKAGE_EXTENSIONS,
  getRepoUrlPlaceholder,
} from '@/utils/sourceIngest'

withDefaults(
  defineProps<{
    /** 来源方式表单项标签（交付物用「来源方式」，知识库用「入库方式」） */
    sourceModeLabel?: string
  }>(),
  {
    sourceModeLabel: '来源方式',
  },
)

const model = defineModel<SourceIngestFormState>({ required: true })

const packageAccept = toAcceptAttribute(SOURCE_PACKAGE_EXTENSIONS)

const repoUrlPlaceholder = computed(() => getRepoUrlPlaceholder(model.value.authType))

/** 登录方式下拉选项 */
const repoAuthOptions = computed(() =>
  (Object.keys(REPO_AUTH_LABEL) as Array<keyof typeof REPO_AUTH_LABEL>).map((value) => ({
    value,
    label: REPO_AUTH_LABEL[value],
  })),
)

const { fileList, hasValidFile, handleBeforeUpload, clearFile, getSelectedFile } =
  useSingleFileUpload({
    allowedExtensions: SOURCE_PACKAGE_EXTENSIONS,
    invalidExtensionMessage: '仅支持 zip、7z、tar.gz 格式的压缩包',
  })

/** 切换来源方式并清空另一侧输入 */
function setSourceMode(mode: SourceIngestMode) {
  model.value.sourceMode = mode
  if (mode === 'repo-pull') {
    clearFile()
    return
  }
  model.value.repositoryUrl = ''
  model.value.accessToken = ''
  model.value.username = ''
  model.value.password = ''
  model.value.sshPrivateKey = ''
  model.value.sshPassphrase = ''
}

/** 重置上传区（弹窗关闭时由父组件调用） */
function resetUpload() {
  clearFile()
}

defineExpose({
  hasValidPackage: hasValidFile,
  getPackageFile: getSelectedFile,
  resetUpload,
})
</script>

<style scoped>
.source-ingest-form {
  margin-top: 0;
}

.source-mode-options {
  display: flex;
  gap: 12px;
}

.source-mode-option {
  flex: 1;
  padding: 10px 16px;
  text-align: center;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.88);
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s, color 0.2s;
}

.source-mode-option:hover {
  border-color: #1677ff;
  color: #1677ff;
}

.source-mode-option--active {
  border-color: #1677ff;
  color: #1677ff;
  box-shadow: 0 2px 8px rgba(22, 119, 255, 0.12);
}

.source-ingest-select {
  width: 100%;
  max-width: 360px;
}

.source-ingest-alert {
  margin-bottom: 16px;
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
</style>
