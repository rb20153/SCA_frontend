<template>
  <a-modal
    v-model:open="visible"
    :title="title"
    :footer="null"
    :width="width"
    destroy-on-close
    @cancel="visible = false"
  >
    <p v-if="hint" class="type-modal-hint">{{ hint }}</p>
    <div class="type-options">
      <button
        v-for="option in options"
        :key="option.key"
        type="button"
        class="type-option"
        :class="{ 'type-option--muted': option.muted }"
        @click="handleSelect(option.key)"
      >
        <span class="type-option__title">{{ option.title }}</span>
        <span class="type-option__desc">{{ option.description }}</span>
      </button>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
/** 入口类型选项（添加交付物、创建任务、添加策略等复用） */
export interface EntryTypePickOption {
  key: string
  title: string
  description: string
  /** 弱化样式（如「稍后上传」） */
  muted?: boolean
}

withDefaults(
  defineProps<{
    /** 弹窗标题 */
    title: string
    /** 选项上方提示文案 */
    hint?: string
    options: EntryTypePickOption[]
    /** 弹窗宽度，默认与项目交付物选型一致 */
    width?: string
  }>(),
  {
    width: '520px',
  },
)

const visible = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  select: [key: string]
}>()

/** 选中某一入口类型后先通知父级，再关闭弹窗（避免 destroy-on-close 打断跳转） */
function handleSelect(key: string) {
  emit('select', key)
  visible.value = false
}
</script>

<style scoped>
.type-modal-hint {
  margin: 0 0 16px;
  color: rgba(0, 0, 0, 0.45);
  font-size: 14px;
}

.type-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.type-option {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  width: 100%;
  padding: 12px 16px;
  text-align: left;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.type-option:hover {
  border-color: #1677ff;
  box-shadow: 0 2px 8px rgba(22, 119, 255, 0.12);
}

.type-option--muted .type-option__title {
  color: rgba(0, 0, 0, 0.65);
}

.type-option__title {
  font-size: 14px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.88);
  line-height: 22px;
}

.type-option__desc {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  line-height: 20px;
}
</style>
