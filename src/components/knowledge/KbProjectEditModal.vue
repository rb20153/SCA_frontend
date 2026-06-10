<template>
  <a-modal
    v-model:open="visible"
    title="编辑开源项目"
    :confirm-loading="submitting"
    ok-text="确定"
    cancel-text="取消"
    destroy-on-close
    @ok="handleOk"
  >
    <a-form layout="vertical">
      <a-form-item label="项目名称" required>
        <a-input
          v-model:value="form.projectName"
          placeholder="请输入项目名称"
          allow-clear
        />
      </a-form-item>

      <a-form-item label="分类" required>
        <a-select
          v-model:value="form.category"
          placeholder="请选择分类"
          :options="KB_PROJECT_CATEGORY_OPTIONS"
        />
      </a-form-item>

      <a-form-item label="采集方式" required>
        <a-select
          v-model:value="form.collectMode"
          placeholder="请选择采集方式"
          :options="KB_COLLECT_MODE_OPTIONS"
        />
      </a-form-item>

      <a-form-item label="标签">
        <a-input
          v-model:value="form.tags"
          placeholder="请输入标签"
          allow-clear
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { updateKbProject } from '@/api/knowledge'
import type { KbProject, UpdateKbProjectParams } from '@/types/knowledge'
import {
  KB_COLLECT_MODE_OPTIONS,
  KB_PROJECT_CATEGORY_OPTIONS,
} from '@/utils/knowledgeQuery'

const props = defineProps<{
  project: KbProject
}>()

const visible = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  success: [project: KbProject]
}>()

const submitting = ref(false)

const form = reactive<UpdateKbProjectParams>({
  projectName: '',
  category: 'simulation_framework',
  collectMode: 'cloud_repo',
  tags: '',
})

/** 将当前行数据同步到表单 */
function syncFormFromProps() {
  form.projectName = props.project.projectName
  form.category = props.project.category
  form.collectMode = props.project.collectMode
  form.tags = props.project.tags ?? ''
}

watch(
  () => visible.value,
  (open) => {
    if (open) {
      syncFormFromProps()
    }
  },
)

watch(
  () => props.project.kbProjectId,
  () => {
    if (visible.value) {
      syncFormFromProps()
    }
  },
)

/** 校验后提交更新 */
async function handleOk() {
  if (!form.projectName.trim()) {
    message.warning('请输入项目名称')
    return Promise.reject()
  }
  if (!form.category) {
    message.warning('请选择分类')
    return Promise.reject()
  }
  if (!form.collectMode) {
    message.warning('请选择采集方式')
    return Promise.reject()
  }

  submitting.value = true
  try {
    const res = await updateKbProject(props.project.kbProjectId, {
      projectName: form.projectName.trim(),
      category: form.category,
      collectMode: form.collectMode,
      tags: form.tags?.trim() || undefined,
    })
    visible.value = false
    message.success('保存成功')
    emit('success', res.data)
  } finally {
    submitting.value = false
  }
}
</script>
