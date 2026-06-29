<template>
  <a-card class="policy-json-card" :bordered="false">
    <template #title>
      <div class="policy-json-card__head">
        <span>JSON/ YAML 配置编辑器</span>
        <a-tag color="blue">主数据源</a-tag>
      </div>
    </template>

    <div class="policy-json-card__editor-wrap">
      <div ref="editorHostRef" class="policy-json-card__editor" />
    </div>
  </a-card>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { usePolicyJsonEditor } from '@/composables/usePolicyJsonEditor'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editorHostRef = ref<HTMLElement | null>(null)
const editorDoc = ref(props.modelValue)

/** 用户编辑后同步到父组件 */
function handleDocChange(value: string) {
  editorDoc.value = value
  emit('update:modelValue', value)
}

usePolicyJsonEditor(editorHostRef, editorDoc, handleDocChange)

/** 父级加载接口数据后写入编辑器 */
watch(
  () => props.modelValue,
  (next) => {
    editorDoc.value = next
  },
  { immediate: true },
)
</script>

<style scoped>
.policy-json-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.policy-json-card :deep(.ant-card-head) {
  min-height: 48px;
}

.policy-json-card :deep(.ant-card-body) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding-bottom: 16px;
}

.policy-json-card__head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.policy-json-card__editor-wrap {
  flex: 1;
  min-height: 0;
}

.policy-json-card__editor {
  height: 100%;
  min-height: 0;
  border: 1px solid #30363d;
  border-radius: 8px;
  overflow: hidden;
}
</style>
