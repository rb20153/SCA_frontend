<template>
  <a-modal
    v-model:open="visible"
    title="立即同步来源"
    :confirm-loading="submitting"
    ok-text="确定"
    cancel-text="取消"
    destroy-on-close
    @ok="handleOk"
  >
    <p class="sync-tip">将立即同步当前选中来源并更新同步数据。</p>
    <p v-if="source" class="sync-source-name">来源：{{ source.sourceName }}</p>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { syncVulnSource } from '@/api/knowledge'
import type { VulnSource } from '@/types/knowledge'

const props = defineProps<{
  source: VulnSource | null
}>()

const visible = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  success: []
}>()

const submitting = ref(false)

/** 提交立即同步请求，成功后关闭弹窗并通知父级刷新 */
async function handleOk() {
  if (!props.source) return

  submitting.value = true
  try {
    await syncVulnSource({
      sourceId: props.source.sourceId,
      sourceCode: props.source.sourceCode,
      sourceName: props.source.sourceName,
    })
    message.success(`「${props.source.sourceName}」同步任务已提交`)
    visible.value = false
    emit('success')
  } finally {
    submitting.value = false
  }
}

watch(
  () => visible.value,
  (open) => {
    if (!open) {
      submitting.value = false
    }
  },
)
</script>

<style scoped>
.sync-tip {
  margin: 0;
  color: rgba(0, 0, 0, 0.88);
  line-height: 1.6;
}

.sync-source-name {
  margin: 12px 0 0;
  color: rgba(0, 0, 0, 0.65);
}
</style>
