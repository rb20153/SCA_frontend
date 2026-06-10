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
        <button
          type="button"
          class="type-option"
          @click="selectMode('fetch')"
        >
          <span class="type-option__title">获取更新</span>
          <span class="type-option__desc">从云端仓库拉取差异并创建新版本快照</span>
        </button>
        <button
          type="button"
          class="type-option"
          @click="selectMode('upload')"
        >
          <span class="type-option__title">上传更新包</span>
          <span class="type-option__desc">上传 zip / 7z / tar.gz 更新包生成新版本</span>
        </button>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { PlusOutlined } from '@ant-design/icons-vue'

const typeModalVisible = ref(false)

/** 选择更新方式后关闭弹窗（后续交互待实现） */
function selectMode(_mode: 'fetch' | 'upload') {
  typeModalVisible.value = false
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
