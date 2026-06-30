<template>
  <div class="create-bar">
    <a-button type="primary" @click="handleCreateClick">
      <template #icon>
        <PlusOutlined />
      </template>
      创建检测任务
    </a-button>

    <EntryTypePickModal
      v-if="variant === 'picker'"
      v-model:open="typeModalVisible"
      title="选择检测类型"
      hint="请选择要创建的检测任务类型"
      :options="taskTypeOptions"
      @select="handleTaskTypeSelect"
    />

    <AutonomyDetectTaskCreateModal
      v-model:open="autonomyModalVisible"
      @success="(task) => emit('created', task)"
    />

    <RiskDetectTaskCreateModal
      v-model:open="riskModalVisible"
      @success="(task) => emit('created', task)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import EntryTypePickModal, {
  type EntryTypePickOption,
} from '@/components/common/EntryTypePickModal.vue'
import AutonomyDetectTaskCreateModal from '@/components/detect/AutonomyDetectTaskCreateModal.vue'
import RiskDetectTaskCreateModal from '@/components/detect/RiskDetectTaskCreateModal.vue'
import type { DetectTask } from '@/types/detect'
import { TASK_TYPE_LABEL } from '@/utils/taskDisplay'

const props = withDefaults(
  defineProps<{
    /** autonomy / risk 直接打开对应弹窗；picker 先选类型（项目详情等场景） */
    variant?: 'autonomy' | 'open-source-risk' | 'picker'
  }>(),
  {
    variant: 'picker',
  },
)

const emit = defineEmits<{
  created: [task: DetectTask]
}>()

const typeModalVisible = ref(false)
const autonomyModalVisible = ref(false)
const riskModalVisible = ref(false)

const taskTypeOptions: EntryTypePickOption[] = [
  {
    key: 'autonomy',
    title: TASK_TYPE_LABEL.autonomy,
    description: '与知识库比对，量化源码与指纹自主率',
  },
  {
    key: 'open-source-risk',
    title: TASK_TYPE_LABEL['open-source-risk'],
    description: '组件识别、漏洞匹配与 SBOM 清单生成',
  },
]

/** 按 variant 打开类型选择或对应创建弹窗 */
function handleCreateClick() {
  if (props.variant === 'autonomy') {
    autonomyModalVisible.value = true
    return
  }
  if (props.variant === 'open-source-risk') {
    riskModalVisible.value = true
    return
  }
  typeModalVisible.value = true
}

/** 类型选择弹窗选中后打开对应创建向导 */
function handleTaskTypeSelect(key: string) {
  if (key === 'autonomy') {
    autonomyModalVisible.value = true
    return
  }
  if (key === 'open-source-risk') {
    riskModalVisible.value = true
  }
}
</script>

<style scoped>
.create-bar {
  margin-bottom: 16px;
}
</style>
