<template>
  <div class="tag-input">
    <div v-if="model.length > 0" class="tag-input__list">
      <a-tag
        v-for="tag in model"
        :key="tag"
        closable
        @close.prevent="removeTag(tag)"
      >
        {{ tag }}
      </a-tag>
    </div>
    <a-input
      v-model:value="inputValue"
      :placeholder="placeholder"
      allow-clear
      @press-enter="handleEnter"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { message } from 'ant-design-vue'

withDefaults(
  defineProps<{
    placeholder?: string
  }>(),
  {
    placeholder: '输入后按回车添加标签',
  },
)

const model = defineModel<string[]>({ required: true })

const inputValue = ref('')

/** 将当前输入追加为标签（去重、忽略空值） */
function addTagFromInput() {
  const value = inputValue.value.trim()
  if (!value) {
    return
  }
  if (model.value.includes(value)) {
    message.warning('标签已存在')
    inputValue.value = ''
    return
  }
  model.value = [...model.value, value]
  inputValue.value = ''
}

/** 回车时添加标签 */
function handleEnter() {
  addTagFromInput()
}

/** 点击标签关闭按钮时移除 */
function removeTag(tag: string) {
  model.value = model.value.filter((item) => item !== tag)
}

/** 清空输入框（弹窗关闭时由父组件调用） */
function clearInput() {
  inputValue.value = ''
}

defineExpose({
  clearInput,
})
</script>

<style scoped>
.tag-input__list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}
</style>
