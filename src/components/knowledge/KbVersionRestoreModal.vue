<template>
  <a-modal
    v-model:open="visible"
    title="恢复版本"
    :confirm-loading="submitting"
    ok-text="确认"
    cancel-text="取消"
    destroy-on-close
    @ok="handleOk"
  >
    <p class="restore-hint">是否将已归档版本重新激活？</p>
  </a-modal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import { restoreKbVersion } from '@/api/knowledge'
import type { KbVersion } from '@/types/knowledge'

const props = defineProps<{
  version: KbVersion
}>()

const visible = defineModel<boolean>('open', { required: true })

const submitting = ref(false)

/** 确认后请求恢复接口；列表状态由后端异步更新，前端不刷新列表 */
async function handleOk() {
  submitting.value = true
  try {
    await restoreKbVersion({
      kbProjectId: props.version.kbProjectId,
      versionId: props.version.versionId,
    })
    message.success('恢复请求已提交')
    visible.value = false
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.restore-hint {
  margin: 0;
  color: rgba(0, 0, 0, 0.88);
}
</style>
