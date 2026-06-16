<template>
  <ListQueryBar @search="emit('search')" @reset="emit('reset')">
    <a-form-item label="版本">
      <AsyncOptionsSelect
        :key="kbProjectId"
        ref="versionSelectRef"
        v-model="filters.versionId"
        placeholder="请选择版本"
        :allow-clear="false"
        select-class="list-query-select"
        :load-options="loadVersionOptions"
      />
    </a-form-item>

    <a-form-item label="关键字">
      <a-input
        v-model:value="filters.keyword"
        placeholder="输入目录、文件名或哈希检索"
        allow-clear
        class="list-query-input-wide"
        @press-enter="emit('search')"
      />
    </a-form-item>

    <template #extra-actions>
      <a-button @click="emit('expand-all')">展开全部</a-button>
      <a-button @click="emit('collapse-all')">折叠全部</a-button>
    </template>
  </ListQueryBar>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import AsyncOptionsSelect from '@/components/common/AsyncOptionsSelect.vue'
import ListQueryBar from '@/components/common/ListQueryBar.vue'
import type { KbProjectDirectoryFilters } from '@/types/knowledge'
import { loadKbVersionSelectOptions } from '@/utils/remoteSelectLoaders'

const props = defineProps<{
  /** 当前知识库项目 ID（来自路由，用于拉取版本列表） */
  kbProjectId: string
  /** 默认版本号文案，用于 prefetch 前展示 label */
  defaultVersionLabel?: string
}>()

const filters = defineModel<KbProjectDirectoryFilters>({ required: true })

const emit = defineEmits<{
  search: []
  reset: []
  'expand-all': []
  'collapse-all': []
}>()

const versionSelectRef = ref<InstanceType<typeof AsyncOptionsSelect> | null>(null)

/** 拉取当前项目的全部版本选项 */
function loadVersionOptions() {
  return loadKbVersionSelectOptions(props.kbProjectId)
}

/** 写入默认版本 label，避免等待 prefetch 前显示空白 */
function seedDefaultVersionLabel() {
  const { versionId } = filters.value
  if (versionId && props.defaultVersionLabel) {
    versionSelectRef.value?.seedOption({
      label: props.defaultVersionLabel,
      value: versionId,
    })
  }
}

/** 预加载版本下拉，保证默认选中项能展示 label */
async function prefetchVersionOptions() {
  if (!props.kbProjectId) {
    return
  }
  await nextTick()
  seedDefaultVersionLabel()
  await versionSelectRef.value?.prefetchOptions()
}

onMounted(() => {
  void prefetchVersionOptions()
})

watch(
  () => props.kbProjectId,
  () => {
    versionSelectRef.value?.resetOptions()
    void prefetchVersionOptions()
  },
)

watch(
  () => filters.value.versionId,
  () => {
    void prefetchVersionOptions()
  },
)

watch(
  () => props.defaultVersionLabel,
  () => {
    seedDefaultVersionLabel()
  },
)
</script>
