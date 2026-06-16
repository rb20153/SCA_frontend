<template>
  <a-modal
    v-model:open="visible"
    :title="title"
    :width="width"
    destroy-on-close
    :footer="null"
    @cancel="emit('cancel')"
  >
    <a-steps :current="currentStep" size="small" class="form-step-wizard__steps">
      <a-step v-for="(stepTitle, index) in steps" :key="index" :title="stepTitle" />
    </a-steps>

    <div class="form-step-wizard__panel" :class="{ 'form-step-wizard__panel--scroll': scrollablePanel }">
      <slot :name="`step-${currentStep}`" />
    </div>

    <div class="form-step-wizard__footer">
      <a-space>
        <a-button @click="emit('cancel')">取消</a-button>
        <a-button v-if="currentStep > 0" @click="emit('prev')">上一步</a-button>
        <a-button
          v-if="currentStep < lastStepIndex"
          type="primary"
          :disabled="!canGoNext"
          @click="emit('next')"
        >
          下一步
        </a-button>
        <a-button
          v-else
          type="primary"
          :loading="submitting"
          :disabled="!canSubmit"
          @click="emit('submit')"
        >
          {{ submitText }}
        </a-button>
      </a-space>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 弹窗标题 */
    title: string
    /** 步骤标题列表 */
    steps: string[]
    /** 当前步骤是否可进入下一步 */
    canGoNext?: boolean
    /** 最后一步是否可提交 */
    canSubmit?: boolean
    /** 提交按钮 loading */
    submitting?: boolean
    /** 最后一步按钮文案 */
    submitText?: string
    /** 弹窗宽度 */
    width?: number | string
    /** 步骤内容区是否可滚动（内容较多时使用） */
    scrollablePanel?: boolean
  }>(),
  {
    canGoNext: false,
    canSubmit: false,
    submitting: false,
    submitText: '确定',
    width: 720,
    scrollablePanel: false,
  },
)

const visible = defineModel<boolean>('open', { required: true })
const currentStep = defineModel<number>('currentStep', { required: true })

const emit = defineEmits<{
  cancel: []
  prev: []
  next: []
  submit: []
}>()

/** 最后一步索引 */
const lastStepIndex = computed(() => Math.max(props.steps.length - 1, 0))
</script>

<style scoped>
.form-step-wizard__steps {
  margin-bottom: 24px;
}

.form-step-wizard__panel {
  min-height: 200px;
}

.form-step-wizard__panel--scroll {
  max-height: min(52vh, 420px);
  overflow-y: auto;
  padding-right: 4px;
}

.form-step-wizard__footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}
</style>
