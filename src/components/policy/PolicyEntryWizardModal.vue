<template>
  <EntryTypePickModal
    v-model:open="typeModalVisible"
    :title="modalTitle"
    hint="请选择添加或编辑策略的方式"
    :options="entryOptions"
    @select="handleEntrySelect"
  />

  <PolicyImportModal
    v-model:open="importModalVisible"
    :context-policy="contextPolicy"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import EntryTypePickModal, {
  type EntryTypePickOption,
} from '@/components/common/EntryTypePickModal.vue'
import PolicyImportModal from '@/components/policy/PolicyImportModal.vue'
import type { Policy } from '@/types/policy'
import { navigateToPolicyEditor } from '@/utils/policyDisplay'

const props = defineProps<{
  /** 编辑已有策略时传入；添加策略时不传 */
  contextPolicy?: Policy | null
}>()

const visible = defineModel<boolean>('open', { required: true })

const router = useRouter()
const typeModalVisible = ref(false)
const importModalVisible = ref(false)

const entryOptions: EntryTypePickOption[] = [
  {
    key: 'editor',
    title: '策略编辑器',
    description: '在可视化编辑器中配置参数与规则',
  },
  {
    key: 'import',
    title: '导入策略',
    description: '上传 JSON / YAML 策略文件并选择导入模式',
  },
]

/** 弹窗标题：添加 / 编辑 */
const modalTitle = computed(() => (props.contextPolicy ? '编辑策略' : '添加策略'))

/** 选择入口：编辑器跳转或打开导入弹窗 */
async function handleEntrySelect(key: string) {
  if (key === 'editor') {
    const policyId = props.contextPolicy?.policyId ?? 'new'
    const policy = props.contextPolicy ?? undefined
    typeModalVisible.value = false
    importModalVisible.value = false
    visible.value = false
    try {
      await navigateToPolicyEditor(router, policyId, policy)
    } catch (error) {
      console.error('[PolicyEditor] 跳转失败：', error)
      message.error('打开策略编辑器失败，请重试')
    }
    return
  }

  if (key === 'import') {
    typeModalVisible.value = false
    importModalVisible.value = true
  }
}

/** 父级打开时展示类型选择弹窗 */
watch(
  () => visible.value,
  (open) => {
    if (open) {
      typeModalVisible.value = true
      importModalVisible.value = false
      return
    }
    typeModalVisible.value = false
    importModalVisible.value = false
  },
)

/** 子弹窗均关闭时同步父级 */
watch([typeModalVisible, importModalVisible], ([typeOpen, importOpen]) => {
  if (!typeOpen && !importOpen) {
    visible.value = false
  }
})
</script>
