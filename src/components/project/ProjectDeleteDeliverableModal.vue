<template>
  <a-modal
    v-model:open="visible"
    title="删除交付物"
    :confirm-loading="submitting"
    ok-text="确定"
    cancel-text="取消"
    ok-type="danger"
    destroy-on-close
    @ok="handleOk"
  >
    <p class="confirm-text">
      是否将该交付物从「{{ projectName }}」项目中移除？
    </p>
  </a-modal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import { deleteProjectDeliverable } from '@/api/project'
import type { ProjectDeliverable } from '@/types/project'

const props = defineProps<{
  projectId: string
  projectName: string
  deliverable: ProjectDeliverable | null
}>()

const visible = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  success: []
}>()

const submitting = ref(false)

/** 确认删除交付物 */
async function handleOk() {
  if (!props.deliverable) {
    return Promise.reject()
  }

  submitting.value = true
  try {
    await deleteProjectDeliverable(props.projectId, props.deliverable.deliverableId)
    message.success('交付物已移除')
    visible.value = false
    emit('success')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.confirm-text {
  margin: 0;
  color: rgba(0, 0, 0, 0.88);
}
</style>
