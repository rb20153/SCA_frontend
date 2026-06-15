<template>
  <div class="update-bar">
    <a-button type="primary" @click="typeModalVisible = true">
      <template #icon>
        <PlusOutlined />
      </template>
      更新版本
    </a-button>

    <a-modal
      v-model:open="typeModalVisible"
      title="选择更新方式"
      :footer="null"
      width="520px"
      destroy-on-close
      @cancel="typeModalVisible = false"
    >
      <p class="type-modal-hint">请选择版本更新方式</p>
      <div class="type-options">
        <button type="button" class="type-option" @click="handleSelectFetch">
          <span class="type-option__title">获取更新</span>
          <span class="type-option__desc">从云端仓库拉取差异并创建新版本快照</span>
        </button>
        <button type="button" class="type-option" @click="handleSelectUpload">
          <span class="type-option__title">上传更新包</span>
          <span class="type-option__desc">上传 zip / 7z / tar.gz 更新包生成新版本</span>
        </button>
      </div>
    </a-modal>

    <KbVersionFetchModal
      v-model:open="fetchVisible"
      :kb-project-id="kbProjectId"
    />

    <KbVersionUploadModal
      v-model:open="uploadVisible"
      :kb-project-id="kbProjectId"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import KbVersionFetchModal from '@/components/knowledge/KbVersionFetchModal.vue'
import KbVersionUploadModal from '@/components/knowledge/KbVersionUploadModal.vue'

defineProps<{
  kbProjectId: string
}>()

const typeModalVisible = ref(false)
const fetchVisible = ref(false)
const uploadVisible = ref(false)

/** 选择获取更新后打开拉取结果弹窗 */
function handleSelectFetch() {
  typeModalVisible.value = false
  fetchVisible.value = true
}

/** 选择上传更新包后打开上传弹窗 */
function handleSelectUpload() {
  typeModalVisible.value = false
  uploadVisible.value = true
}
</script>

<style scoped>
.update-bar {
  margin-bottom: 16px;
}

.type-modal-hint {
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
</style>
