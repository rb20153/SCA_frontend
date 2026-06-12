<template>
  <a-modal
    v-model:open="visible"
    :title="modalTitle"
    destroy-on-close
    @cancel="handleCancel"
  >
    <p class="delete-message">{{ messageText }}</p>

    <template #footer>
      <a-button @click="handleCancel">{{ cancelText }}</a-button>
      <a-button
        v-if="!hasBindings"
        type="primary"
        danger
        :loading="submitting"
        @click="handleOk"
      >
        确定
      </a-button>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { message } from 'ant-design-vue'

const props = defineProps<{
  /** 弹窗标题（无绑定时） */
  title: string
  /** 当前绑定数量（来自列表行数据，不再请求后端） */
  boundCount: number
  /** 有绑定时提示文案 */
  blockMessage: string
  /** 无绑定时二次确认文案 */
  confirmMessage: string
  /** 确认删除时执行的 API */
  deleteFn: () => Promise<void>
  /** 删除成功提示 */
  successMessage?: string
}>()

const visible = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  success: []
}>()

const submitting = ref(false)

const hasBindings = computed(() => props.boundCount > 0)

const modalTitle = computed(() => (hasBindings.value ? '无法删除' : props.title))

const cancelText = computed(() => (hasBindings.value ? '关闭' : '取消'))

const messageText = computed(() =>
  hasBindings.value ? props.blockMessage : props.confirmMessage,
)

/** 关闭弹窗 */
function handleCancel() {
  visible.value = false
}

/** 无绑定时确认删除 */
async function handleOk() {
  if (hasBindings.value) {
    return
  }

  submitting.value = true
  try {
    await props.deleteFn()
    message.success(props.successMessage ?? '删除成功')
    visible.value = false
    emit('success')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.delete-message {
  margin: 0;
  color: rgba(0, 0, 0, 0.88);
  line-height: 1.6;
}
</style>
