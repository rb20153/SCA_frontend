<template>
  <div class="deliverable-add-bar">
    <a-button type="primary" @click="typeModalVisible = true">
      <template #icon>
        <PlusOutlined />
      </template>
      添加交付物
    </a-button>

    <EntryTypePickModal
      v-model:open="typeModalVisible"
      title="选择交付物类型"
      hint="请选择要添加的交付物类型"
      :options="deliverableTypeOptions"
      @select="handleTypeSelect"
    />

    <ProjectBinaryDeliverableUploadModal
      v-model:open="binaryUploadVisible"
      :project-id="projectId"
      :collect-only="collectOnly"
      @collected="emit('binary-collected', $event)"
    />

    <ProjectSourceDeliverableAddModal
      v-model:open="sourceAddVisible"
      :project-id="projectId"
      :collect-only="collectOnly"
      @collected="emit('source-collected', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import EntryTypePickModal, {
  type EntryTypePickOption,
} from '@/components/common/EntryTypePickModal.vue'
import ProjectBinaryDeliverableUploadModal from '@/components/project/ProjectBinaryDeliverableUploadModal.vue'
import ProjectSourceDeliverableAddModal from '@/components/project/ProjectSourceDeliverableAddModal.vue'
import type {
  AddProjectSourceDeliverableParams,
  UploadProjectBinaryDeliverableParams,
} from '@/types/project'

withDefaults(
  defineProps<{
    projectId?: string
    /** 仅收集数据，创建项目向导中使用 */
    collectOnly?: boolean
  }>(),
  {
    collectOnly: false,
  },
)

const emit = defineEmits<{
  'source-collected': [payload: AddProjectSourceDeliverableParams]
  'binary-collected': [payload: UploadProjectBinaryDeliverableParams]
}>()

const typeModalVisible = ref(false)
const binaryUploadVisible = ref(false)
const sourceAddVisible = ref(false)

const deliverableTypeOptions: EntryTypePickOption[] = [
  {
    key: 'source',
    title: '添加源码交付物',
    description: '从三方仓库拉取或上传源码包（.zip / .tar.gz）',
  },
  {
    key: 'binary',
    title: '上传二进制',
    description: '上传 .a / .so / .dll 等二进制交付文件',
  },
]

/** 按所选类型打开对应交付物弹窗 */
function handleTypeSelect(key: string) {
  if (key === 'source') {
    sourceAddVisible.value = true
    return
  }
  if (key === 'binary') {
    binaryUploadVisible.value = true
  }
}
</script>

<style scoped>
.deliverable-add-bar {
  margin-bottom: 16px;
}
</style>
