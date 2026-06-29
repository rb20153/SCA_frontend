<template>
  <div class="update-bar">
    <a-button type="primary" @click="typeModalVisible = true">
      <template #icon>
        <PlusOutlined />
      </template>
      更新版本
    </a-button>

    <EntryTypePickModal
      v-model:open="typeModalVisible"
      title="选择更新方式"
      hint="请选择版本更新方式"
      :options="updateTypeOptions"
      @select="handleUpdateTypeSelect"
    />

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
import EntryTypePickModal, {
  type EntryTypePickOption,
} from '@/components/common/EntryTypePickModal.vue'
import KbVersionFetchModal from '@/components/knowledge/KbVersionFetchModal.vue'
import KbVersionUploadModal from '@/components/knowledge/KbVersionUploadModal.vue'

defineProps<{
  kbProjectId: string
}>()

const typeModalVisible = ref(false)
const fetchVisible = ref(false)
const uploadVisible = ref(false)

const updateTypeOptions: EntryTypePickOption[] = [
  {
    key: 'fetch',
    title: '获取更新',
    description: '从云端仓库拉取差异并创建新版本快照',
  },
  {
    key: 'upload',
    title: '上传更新包',
    description: '上传 zip / 7z / tar.gz 更新包生成新版本',
  },
]

/** 按所选方式打开对应更新弹窗 */
function handleUpdateTypeSelect(key: string) {
  if (key === 'fetch') {
    fetchVisible.value = true
    return
  }
  if (key === 'upload') {
    uploadVisible.value = true
  }
}
</script>

<style scoped>
.update-bar {
  margin-bottom: 16px;
}
</style>
