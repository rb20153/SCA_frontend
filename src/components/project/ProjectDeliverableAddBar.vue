<template>
  <div class="create-bar">
    <a-button type="primary" @click="typeModalVisible = true">
      <template #icon>
        <PlusOutlined />
      </template>
      添加交付物
    </a-button>

    <a-modal
      v-model:open="typeModalVisible"
      title="选择交付物类型"
      :footer="null"
      width="520px"
      destroy-on-close
      @cancel="typeModalVisible = false"
    >
      <p class="type-modal-hint">请选择要添加的交付物类型</p>
      <div class="type-options">
        <button type="button" class="type-option" @click="handleSelectSource">
          <span class="type-option__title">添加源码交付物</span>
          <span class="type-option__desc">从三方仓库拉取或上传源码包（.zip / .tar.gz）</span>
        </button>
        <button type="button" class="type-option" @click="handleSelectBinary">
          <span class="type-option__title">上传二进制</span>
          <span class="type-option__desc">上传 .a / .so / .dll 等二进制交付文件</span>
        </button>
      </div>
    </a-modal>

    <ProjectBinaryDeliverableUploadModal
      v-model:open="binaryUploadVisible"
      :project-id="projectId"
    />

    <ProjectSourceDeliverableAddModal
      v-model:open="sourceAddVisible"
      :project-id="projectId"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import ProjectBinaryDeliverableUploadModal from '@/components/project/ProjectBinaryDeliverableUploadModal.vue'
import ProjectSourceDeliverableAddModal from '@/components/project/ProjectSourceDeliverableAddModal.vue'

defineProps<{
  projectId: string
}>()

const typeModalVisible = ref(false)
const binaryUploadVisible = ref(false)
const sourceAddVisible = ref(false)

/** 关闭类型选择弹窗并打开源码交付物添加弹窗 */
function handleSelectSource() {
  typeModalVisible.value = false
  sourceAddVisible.value = true
}

/** 关闭类型选择弹窗并打开二进制上传弹窗 */
function handleSelectBinary() {
  typeModalVisible.value = false
  binaryUploadVisible.value = true
}
</script>

<style scoped>
.create-bar {
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
