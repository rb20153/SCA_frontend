<template>
  <a-select
    v-model:value="model"
    :size="size"
    :placeholder="placeholder"
    :options="options"
    :loading="loading"
    :allow-clear="allowClear"
    :show-search="showSearch"
    :disabled="disabled"
    option-filter-prop="label"
    :class="selectClass"
    @dropdown-visible-change="handleDropdownVisibleChange"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { SelectOption } from '@/types/common'

const props = withDefaults(
  defineProps<{
    /** 展开下拉时拉取选项 */
    loadOptions: () => Promise<SelectOption[]>
    placeholder?: string
    allowClear?: boolean
    showSearch?: boolean
    disabled?: boolean
    selectClass?: string
    /** 每次展开都重新请求；默认仅首次展开请求 */
    reloadOnEachOpen?: boolean
    /** Ant Design Select 尺寸 */
    size?: 'small' | 'middle' | 'large'
  }>(),
  {
    placeholder: '请选择',
    allowClear: true,
    showSearch: true,
    disabled: false,
    selectClass: '',
    reloadOnEachOpen: false,
    size: 'middle',
  },
)

const model = defineModel<string | undefined>({ required: true })

const loading = ref(false)
const options = ref<SelectOption[]>([])
const loaded = ref(false)

/** 展开下拉时按需拉取选项 */
async function handleDropdownVisibleChange(open: boolean) {
  if (!open) {
    return
  }
  if (loaded.value && !props.reloadOnEachOpen) {
    return
  }

  loading.value = true
  try {
    options.value = await props.loadOptions()
    loaded.value = true
  } finally {
    loading.value = false
  }
}

/** 获取当前选中项 label */
function getSelectedLabel(): string | undefined {
  return options.value.find((item) => item.value === model.value)?.label
}

/** 清空选项缓存（弹窗关闭时调用） */
function resetOptions() {
  options.value = []
  loaded.value = false
}

/** 写入单项占位选项，避免 prefetch 前 Select 无法展示 label */
function seedOption(option: SelectOption) {
  if (options.value.some((item) => item.value === option.value)) {
    return
  }
  options.value = [...options.value, option]
}

/** 预加载选项（编辑回填 departmentId 等场景） */
async function prefetchOptions() {
  if (loaded.value) {
    return options.value
  }
  loading.value = true
  try {
    options.value = await props.loadOptions()
    loaded.value = true
    return options.value
  } finally {
    loading.value = false
  }
}

defineExpose({
  getSelectedLabel,
  resetOptions,
  prefetchOptions,
  seedOption,
})
</script>
