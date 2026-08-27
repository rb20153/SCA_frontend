<template>
  <a-modal
    v-model:open="visible"
    title="导出系统日志"
    :confirm-loading="submitting"
    ok-text="确定"
    cancel-text="取消"
    destroy-on-close
    @ok="handleOk"
  >
    <a-form ref="formRef" :model="formState" :rules="rules" layout="vertical">
      <a-form-item label="时间范围" name="timeRange" required>
        <a-range-picker
          v-model:value="formState.timeRange"
          show-time
          format="YYYY-MM-DD HH:mm"
          :placeholder="['开始时间', '结束时间']"
          class="log-export-range"
        />
      </a-form-item>

      <a-form-item label="导出格式" name="format">
        <a-select
          v-model:value="formState.format"
          :options="LOG_EXPORT_FORMAT_OPTIONS"
          class="log-export-format"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { FormInstance, Rule } from 'ant-design-vue/es/form'
import { message } from 'ant-design-vue'
import type { Dayjs } from 'dayjs'
import { exportLogs } from '@/api/system'
import type { LogExportFormat } from '@/types/system'
import { createDefaultLogExportRange, LOG_EXPORT_FORMAT_OPTIONS } from '@/utils/logQuery'
import { triggerReportDownload } from '@/utils/reportDownload'

const visible = defineModel<boolean>('open', { required: true })

const formRef = ref<FormInstance>()
const submitting = ref(false)

const formState = reactive<{
  timeRange: [Dayjs, Dayjs] | undefined
  format: LogExportFormat
}>({
  timeRange: createDefaultLogExportRange(),
  format: 'csv',
})

const rules: Record<string, Rule[]> = {
  timeRange: [{ required: true, message: '请选择时间范围', type: 'array' }],
}

/** 重置导出表单为默认值 */
function resetForm() {
  formState.timeRange = createDefaultLogExportRange()
  formState.format = 'csv'
}

/** 提交导出请求并触发浏览器下载；校验失败时阻止弹窗关闭 */
async function handleOk() {
  try {
    await formRef.value?.validate()
  } catch {
    return Promise.reject()
  }

  if (!formState.timeRange) return

  submitting.value = true
  try {
    const res = await exportLogs({
      startTime: formState.timeRange[0].format('YYYY-MM-DD HH:mm:ss'),
      endTime: formState.timeRange[1].format('YYYY-MM-DD HH:mm:ss'),
      format: formState.format,
    })
    triggerReportDownload(res.data.downloadUrl, res.data.fileName)
    message.success('日志导出已开始下载')
    visible.value = false
  } finally {
    submitting.value = false
  }
}

watch(
  () => visible.value,
  (open) => {
    if (open) {
      resetForm()
    }
  },
)
</script>

<style scoped>
.log-export-range {
  width: 100%;
}

.log-export-format {
  width: 200px;
}
</style>
