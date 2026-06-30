<template>
  <a-modal
    v-model:open="visible"
    title="更新说明"
    :footer="null"
    destroy-on-close
  >
    <pre class="update-notes-body">{{ notesText }}</pre>
  </a-modal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { KbVersion } from '@/types/knowledge'

const props = defineProps<{
  version: KbVersion
}>()

const visible = defineModel<boolean>('open', { required: true })

/** 弹窗展示的更新说明正文 */
const notesText = computed(
  () => props.version.updateNotes?.trim() || '暂无更新说明',
)
</script>

<style scoped>
.update-notes-body {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.6;
  color: rgba(0, 0, 0, 0.88);
}
</style>
