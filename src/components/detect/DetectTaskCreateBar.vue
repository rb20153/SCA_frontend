<template>
  <div class="create-bar">
    <a-button type="primary" @click="typeModalVisible = true">
      <template #icon>
        <PlusOutlined />
      </template>
      创建检测任务
    </a-button>

    <a-modal
      v-model:open="typeModalVisible"
      title="选择检测类型"
      :footer="null"
      width="520px"
      destroy-on-close
      @cancel="typeModalVisible = false"
    >
      <p class="type-modal-hint">请选择要创建的检测任务类型</p>
      <div class="type-options">
        <button
          type="button"
          class="type-option"
          @click="selectType('autonomy')"
        >
          <span class="type-option__title">{{ TASK_TYPE_LABEL.autonomy }}</span>
          <span class="type-option__desc">与知识库比对，量化源码与指纹自主率</span>
        </button>
        <button
          type="button"
          class="type-option"
          @click="selectType('open-source-risk')"
        >
          <span class="type-option__title">{{ TASK_TYPE_LABEL['open-source-risk'] }}</span>
          <span class="type-option__desc">组件识别、漏洞匹配与 SBOM 清单生成</span>
        </button>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import type { TaskType } from '@/types/common'
import { TASK_TYPE_LABEL } from '@/utils/taskDisplay'

const emit = defineEmits<{
  'create-autonomy': []
  'create-risk': []
}>()

const typeModalVisible = ref(false)

function selectType(taskType: TaskType) {
  typeModalVisible.value = false
  if (taskType === 'autonomy') {
    emit('create-autonomy')
  } else {
    emit('create-risk')
  }
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
