<template>
  <a-modal
    v-model:open="visible"
    title="新建模板"
    :confirm-loading="submitting"
    ok-text="确定"
    cancel-text="取消"
    destroy-on-close
    @ok="handleOk"
  >
    <a-form layout="vertical">
      <a-form-item label="模板名称" required>
        <a-input
          v-model:value="form.templateName"
          placeholder="请输入模板名称"
          allow-clear
        />
      </a-form-item>
      <a-form-item label="复制自">
        <a-select
          v-model:value="form.copyFromTemplateId"
          placeholder="空白模板"
          allow-clear
          :options="copyFromOptions"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { createReportTemplate } from '@/api/reportTemplate'
import type { ReportTemplate } from '@/types/reportTemplate'

const props = defineProps<{
  /** 可选的复制来源模板列表 */
  templates: ReportTemplate[]
}>()

const visible = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  success: [templateId: string]
}>()

const submitting = ref(false)

const form = reactive({
  templateName: '新建 Markdown 报告模板',
  copyFromTemplateId: undefined as string | undefined,
})

/** 复制自下拉选项 */
const copyFromOptions = computed(() =>
  props.templates.map((item) => ({
    label: item.templateName,
    value: item.templateId,
  })),
)

watch(
  () => visible.value,
  (open) => {
    if (open) {
      form.templateName = '新建 Markdown 报告模板'
      form.copyFromTemplateId = undefined
    }
  },
)

/** 校验并创建模板，成功后返回新模板 ID */
async function handleOk() {
  const templateName = form.templateName.trim()
  if (!templateName) {
    message.warning('请输入模板名称')
    return
  }

  submitting.value = true
  try {
    const res = await createReportTemplate({
      templateName,
      copyFromTemplateId: form.copyFromTemplateId,
    })
    visible.value = false
    emit('success', res.data.templateId)
  } finally {
    submitting.value = false
  }
}
</script>
