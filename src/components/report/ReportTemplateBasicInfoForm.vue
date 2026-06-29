<template>
  <a-form layout="vertical" class="template-basic-form">
    <a-row :gutter="24">
      <a-col :xs="24" :md="12" :lg="8">
        <a-form-item label="模板名称" required>
          <a-input
            v-model:value="form.templateName"
            placeholder="请输入模板名称"
            allow-clear
            :disabled="props.readonly"
          />
        </a-form-item>
      </a-col>

      <a-col :xs="24" :md="12" :lg="8">
        <a-form-item label="版本" required>
          <a-input
            v-model:value="form.version"
            placeholder="例如 v1.0"
            allow-clear
            :disabled="props.readonly"
          />
        </a-form-item>
      </a-col>

      <a-col :xs="24" :md="12" :lg="8">
        <a-form-item label="输出格式" required>
          <a-select
            v-model:value="form.outputFormat"
            placeholder="请选择"
            :options="REPORT_TEMPLATE_OUTPUT_FORMAT_OPTIONS"
            class="template-basic-select"
            :disabled="props.readonly"
          />
        </a-form-item>
      </a-col>

      <a-col :xs="24" :md="12" :lg="8">
        <a-form-item label="可见范围" required>
          <a-select
            v-model:value="form.visibility"
            placeholder="请选择"
            :options="REPORT_TEMPLATE_VISIBILITY_OPTIONS"
            class="template-basic-select"
            :disabled="props.readonly"
            @change="handleVisibilityChange"
          />
        </a-form-item>
      </a-col>

      <a-col :xs="24" :md="12" :lg="8">
        <a-form-item label="绑定项目" :required="isProjectVisibility">
          <AsyncOptionsSelect
            ref="projectSelectRef"
            v-model="form.projectId"
            placeholder="请选择"
            select-class="template-basic-select"
            :disabled="!isProjectVisibility || props.readonly"
            :load-options="loadDetectTaskProjectSelectOptions"
          />
          <p v-if="isProjectVisibility" class="template-basic-hint">
            「项目组可用」时必填；仅该项目成员可见/可选用
          </p>
        </a-form-item>
      </a-col>

      <a-col :xs="24" :md="12" :lg="8">
        <a-form-item label="默认模板" required>
          <a-select
            v-model:value="isDefaultValue"
            placeholder="请选择"
            :options="REPORT_TEMPLATE_IS_DEFAULT_OPTIONS"
            class="template-basic-select"
            :disabled="props.readonly"
          />
        </a-form-item>
      </a-col>
    </a-row>
  </a-form>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AsyncOptionsSelect from '@/components/common/AsyncOptionsSelect.vue'
import type { ReportTemplateEditorForm } from '@/types/reportTemplate'
import {
  REPORT_TEMPLATE_IS_DEFAULT_OPTIONS,
  REPORT_TEMPLATE_OUTPUT_FORMAT_OPTIONS,
  REPORT_TEMPLATE_VISIBILITY_OPTIONS,
} from '@/utils/reportTemplateDisplay'
import { loadDetectTaskProjectSelectOptions } from '@/utils/remoteSelectLoaders'

const props = defineProps<{
  /** 绑定项目名称，用于编辑态下拉回填 */
  boundProjectName?: string
  /** 系统内置模板只读查看 */
  readonly?: boolean
}>()

const form = defineModel<ReportTemplateEditorForm>({ required: true })

const projectSelectRef = ref<InstanceType<typeof AsyncOptionsSelect> | null>(null)

/** 可见范围为项目组可用时需绑定项目 */
const isProjectVisibility = computed(() => form.value.visibility === 'project')

/** 默认模板布尔值与下拉 string 互转 */
const isDefaultValue = computed({
  get() {
    if (form.value.isDefault === undefined) {
      return undefined
    }
    return form.value.isDefault ? 'true' : 'false'
  },
  set(value: string | undefined) {
    if (value === undefined) {
      form.value.isDefault = undefined
      return
    }
    form.value.isDefault = value === 'true'
  },
})

/** 可见范围切换为非项目组时清空绑定项目 */
function handleVisibilityChange(value: unknown) {
  if (value !== 'project') {
    form.value.projectId = undefined
  }
}

/** 编辑态预填绑定项目下拉选项与 label */
async function prefetchBoundProjectOptions() {
  const projectId = form.value.projectId
  const projectName = props.boundProjectName
  if (!projectId || !projectName) {
    return
  }

  projectSelectRef.value?.seedOption({
    value: projectId,
    label: projectName,
  })
  await projectSelectRef.value?.prefetchOptions()
}

watch(
  () => [form.value.projectId, props.boundProjectName] as const,
  () => {
    void prefetchBoundProjectOptions()
  },
  { immediate: true },
)
</script>

<style scoped>
.template-basic-form {
  margin-bottom: 0;
}

.template-basic-select {
  width: 100%;
}

.template-basic-hint {
  margin: 8px 0 0;
  color: rgba(0, 0, 0, 0.45);
  font-size: 13px;
  line-height: 1.5;
}
</style>
