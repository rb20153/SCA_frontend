<template>
  <a-modal
    v-model:open="visible"
    title="创建自主率检测任务"
    width="720px"
    destroy-on-close
    :footer="null"
    @cancel="handleCancel"
  >
    <a-spin :spinning="optionsLoading">
      <a-steps :current="currentStep" size="small" class="wizard-steps">
        <a-step title="选择项目" />
        <a-step title="扫描模式" />
        <a-step title="执行配置" />
      </a-steps>

      <div class="wizard-panel">
        <template v-if="currentStep === 0">
          <a-form layout="vertical">
            <a-form-item label="关联项目" required>
              <a-select
                v-model:value="form.projectId"
                placeholder="请选择"
                show-search
                option-filter-prop="label"
                :options="projectOptions"
                class="wizard-select"
              />
            </a-form-item>
            <a-form-item label="任务名称" required>
              <a-input
                v-model:value="form.taskName"
                placeholder="请输入任务名称"
                allow-clear
              />
            </a-form-item>
          </a-form>
        </template>

        <template v-else-if="currentStep === 1">
          <a-form layout="vertical">
            <a-form-item label="扫描模式" required>
              <a-select
                v-model:value="form.scanMode"
                :options="AUTONOMY_SCAN_MODE_OPTIONS"
                class="wizard-select"
              />
            </a-form-item>
            <a-alert
              type="info"
              show-icon
              :message="AUTONOMY_SCAN_MODE_HINT[form.scanMode]"
              class="scan-mode-hint"
            />
          </a-form>
        </template>

        <template v-else>
          <a-form layout="vertical">
            <a-form-item label="执行方式">
              <a-radio-group v-model:value="form.executionMode" :options="TASK_EXECUTION_MODE_OPTIONS" />
            </a-form-item>
            <a-form-item label="Worker 数量">
              <a-input-number
                v-model:value="form.workerCount"
                :min="1"
                :max="64"
                class="wizard-number"
              />
            </a-form-item>
            <a-form-item label="失败自动重试">
              <a-switch v-model:checked="form.autoRetryEnabled" />
            </a-form-item>
            <a-form-item v-if="form.autoRetryEnabled" label="重试次数">
              <a-input-number
                v-model:value="form.retryCount"
                :min="1"
                :max="10"
                class="wizard-number"
              />
            </a-form-item>
          </a-form>
        </template>
      </div>

      <div class="wizard-footer">
        <a-space>
          <a-button @click="handleCancel">取消</a-button>
          <a-button v-if="currentStep > 0" @click="goPrev">上一步</a-button>
          <a-button
            v-if="currentStep < 2"
            type="primary"
            :disabled="!canGoNext"
            @click="goNext"
          >
            下一步
          </a-button>
          <a-button
            v-else
            type="primary"
            :loading="submitting"
            :disabled="!canSubmit"
            @click="handleSubmit"
          >
            确认创建
          </a-button>
        </a-space>
      </div>
    </a-spin>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { createDetectTask, getDetectTaskProjectOptions } from '@/api/detect'
import type { DetectTask, DetectTaskProjectOption } from '@/types/detect'
import {
  AUTONOMY_SCAN_MODE_HINT,
  AUTONOMY_SCAN_MODE_OPTIONS,
  TASK_EXECUTION_MODE_OPTIONS,
  createDefaultAutonomyTaskForm,
} from '@/utils/taskCreate'

const visible = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  success: [task: DetectTask]
}>()

const optionsLoading = ref(false)
const submitting = ref(false)
const currentStep = ref(0)
const projects = ref<DetectTaskProjectOption[]>([])

const form = reactive(createDefaultAutonomyTaskForm())

/** 项目下拉选项 */
const projectOptions = computed(() =>
  projects.value.map((item) => ({
    value: item.projectId,
    label: item.projectName,
  })),
)

/** 第一步：关联项目与任务名称必填 */
const isStep0Valid = computed(
  () => form.projectId.trim().length > 0 && form.taskName.trim().length > 0,
)

/** 第二步：扫描模式始终有默认值 */
const isStep1Valid = computed(() => Boolean(form.scanMode))

/** 第三步：Worker 与重试次数合法 */
const isStep2Valid = computed(() => {
  if (form.workerCount < 1) return false
  if (form.autoRetryEnabled && (form.retryCount === undefined || form.retryCount < 1)) {
    return false
  }
  return true
})

/** 当前步骤是否可进入下一步 */
const canGoNext = computed(() => {
  if (currentStep.value === 0) return isStep0Valid.value
  if (currentStep.value === 1) return isStep1Valid.value
  return false
})

/** 最后一步是否可提交 */
const canSubmit = computed(() => isStep0Valid.value && isStep1Valid.value && isStep2Valid.value)

/** 拉取关联项目下拉数据 */
async function fetchProjectOptions() {
  optionsLoading.value = true
  try {
    const res = await getDetectTaskProjectOptions()
    projects.value = res.data
  } finally {
    optionsLoading.value = false
  }
}

/** 重置向导到初始状态 */
function resetWizard() {
  Object.assign(form, createDefaultAutonomyTaskForm())
  currentStep.value = 0
}

/** 关闭弹窗 */
function handleCancel() {
  visible.value = false
}

/** 进入下一步 */
function goNext() {
  if (!canGoNext.value) return
  currentStep.value += 1
}

/** 返回上一步 */
function goPrev() {
  if (currentStep.value > 0) {
    currentStep.value -= 1
  }
}

/** 提交创建自主率检测任务 */
async function handleSubmit() {
  if (!canSubmit.value) return

  submitting.value = true
  try {
    const res = await createDetectTask({
      taskType: 'autonomy',
      taskName: form.taskName.trim(),
      projectId: form.projectId,
      scanMode: form.scanMode,
      executionMode: form.executionMode,
      workerCount: form.workerCount,
      autoRetryEnabled: form.autoRetryEnabled,
      retryCount: form.autoRetryEnabled ? form.retryCount : undefined,
    })
    message.success('自主率检测任务已创建')
    visible.value = false
    emit('success', res.data)
  } finally {
    submitting.value = false
  }
}

watch(
  () => visible.value,
  (open) => {
    if (open) {
      resetWizard()
      fetchProjectOptions()
    }
  },
)
</script>

<style scoped>
.wizard-steps {
  margin-bottom: 24px;
}

.wizard-panel {
  min-height: 220px;
}

.wizard-select {
  width: 100%;
  max-width: 360px;
}

.wizard-number {
  width: 120px;
}

.scan-mode-hint {
  margin-top: 8px;
}

.wizard-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}
</style>
