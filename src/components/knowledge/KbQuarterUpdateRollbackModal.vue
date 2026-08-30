<template>
  <a-modal
    v-model:open="visible"
    title="季度回滚"
    ok-text="确定"
    cancel-text="取消"
    :confirm-loading="submitting"
    :ok-button-props="{ disabled: loading || !selectedQuarter || submitting }"
    :mask-closable="!submitting"
    :closable="!submitting"
    destroy-on-close
    @ok="handleOk"
  >
    <a-spin :spinning="loading">
      <a-form layout="vertical">
        <a-form-item label="回滚季度" required>
          <a-select
            v-model:value="selectedQuarter"
            placeholder="请选择"
            :options="quarterOptions"
            :disabled="loading || submitting"
          />
        </a-form-item>
      </a-form>
    </a-spin>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import {
  getKbQuarterUpdateQuarterOptions,
  rollbackKbQuarterUpdate,
} from '@/api/knowledge'
import { usePagePermission } from '@/composables/usePagePermission'

const visible = defineModel<boolean>('open', { required: true })
const { canWrite } = usePagePermission()

const emit = defineEmits<{
  success: []
}>()

const loading = ref(false)
const submitting = ref(false)
const selectedQuarter = ref('')
const quarters = ref<string[]>([])

const quarterOptions = computed(() => quarters.value.map((quarter) => ({ label: quarter, value: quarter })))

/** 每次打开回滚弹窗时都重新获取可回滚季度。 */
async function fetchQuarterOptions() {
  loading.value = true
  quarters.value = []
  selectedQuarter.value = ''
  try {
    const res = await getKbQuarterUpdateQuarterOptions()
    quarters.value = res.data
  } catch {
    visible.value = false
  } finally {
    loading.value = false
  }
}

/** 校验季度后提交回滚请求。 */
async function handleOk() {
  if (!canWrite('/knowledge/quarter-updates') || submitting.value) return
  if (!selectedQuarter.value) {
    message.warning('请选择回滚季度')
    return
  }

  submitting.value = true
  try {
    await rollbackKbQuarterUpdate({ quarter: selectedQuarter.value })
    message.success('操作成功')
    visible.value = false
    emit('success')
  } catch {
    // 请求层已展示失败原因，避免重复提示。
  } finally {
    submitting.value = false
  }
}

watch(
  () => visible.value,
  (open) => {
    if (open) {
      void fetchQuarterOptions()
    } else {
      selectedQuarter.value = ''
      quarters.value = []
    }
  },
)
</script>
