<template>
  <a-modal
    v-model:open="visible"
    title="删除开源项目"
    :confirm-loading="submitting"
    ok-text="确定"
    cancel-text="取消"
    ok-type="danger"
    :ok-button-props="{ disabled: !canConfirm }"
    destroy-on-close
    @ok="handleOk"
  >
    <p class="delete-hint">将同步删除该项目的版本、目录和索引信息。</p>
    <a-form layout="vertical" class="delete-form">
      <a-form-item :label="`请输入「${project.projectName}」确认`">
        <a-input
          v-model:value="confirmName"
          placeholder="请输入项目名称"
          allow-clear
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { deleteKbProject } from '@/api/knowledge'
import type { KbProject } from '@/types/knowledge'

const props = defineProps<{
  project: KbProject
}>()

const visible = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  success: []
}>()

const submitting = ref(false)
const confirmName = ref('')

/** 输入名称与项目名称完全一致时才允许确认删除 */
const canConfirm = computed(
  () => confirmName.value.trim() === props.project.projectName.trim(),
)

watch(
  () => visible.value,
  (open) => {
    if (!open) {
      confirmName.value = ''
    }
  },
)

/** 名称校验通过后调用删除 API */
async function handleOk() {
  if (!canConfirm.value) {
    message.warning('请输入正确的项目名称以确认删除')
    return Promise.reject()
  }

  submitting.value = true
  try {
    await deleteKbProject(props.project.kbProjectId)
    message.success('删除成功')
    visible.value = false
    emit('success')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.delete-hint {
  margin: 0 0 8px;
  color: rgba(0, 0, 0, 0.88);
}

.delete-form {
  margin-top: 8px;
}
</style>
