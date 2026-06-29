<template>
  <a-modal
    v-model:open="visible"
    title="新建模板"
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
import { computed, reactive, watch } from 'vue'
import { message } from 'ant-design-vue'
import type { NewReportTemplateDraftParams, ReportTemplate } from '@/types/reportTemplate'

const props = defineProps<{
  /** 可选的复制来源模板列表 */
  templates: ReportTemplate[]
}>()

const visible = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  navigate: [draft: NewReportTemplateDraftParams]
}>()

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

/** 校验模板名称后进入编辑器（保存请求在编辑页「保存模板」触发） */
function handleOk() {
  const templateName = form.templateName.trim()
  if (!templateName) {
    message.warning('请输入模板名称')
    return
  }

  visible.value = false
  emit('navigate', {
    templateName,
    copyFromTemplateId: form.copyFromTemplateId,
  })
}
</script>
