<template>
  <a-modal
    v-model:open="visible"
    title="处理告警"
    :confirm-loading="submitting"
    ok-text="确定"
    cancel-text="取消"
    width="720px"
    destroy-on-close
    @ok="handleSubmit"
  >
    <a-form layout="vertical" class="alert-handle-form">
      <a-form-item label="处理方式" required>
        <a-select
          v-model:value="disposition"
          placeholder="请选择处理方式"
          :options="dispositionOptions"
          class="modal-select-full"
        />
        <p class="form-hint">
          选择后下方展示对应后续动作；提交前不展示处理时间线（时间线在处置完成后于「已处理」列表查看）。
        </p>
      </a-form-item>

      <a-card
        v-if="followUp"
        :bordered="false"
        size="small"
        class="follow-up-card"
      >
        <h4 class="follow-up-title">后续动作</h4>
        <p v-for="(line, index) in followUp.paragraphs" :key="index" class="follow-up-line">
          {{ line }}
        </p>
      </a-card>

      <template v-if="disposition === ALERT_DISPOSITION.TransferReview">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="指派负责人" required>
              <a-select
                v-model:value="assigneeUserId"
                placeholder="请选择"
                :options="assigneeSelectOptions"
                class="modal-select-full"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="计划完成时间">
              <a-date-picker
                v-model:value="plannedCompleteAt"
                show-time
                format="YYYY-MM-DD HH:mm"
                class="modal-select-full"
              />
            </a-form-item>
          </a-col>
        </a-row>
        <p class="form-hint notify-hint">
          将向<strong>被指派的工程师</strong>发送站内消息（告警转派待办）。
        </p>
      </template>

      <a-form-item
        v-if="disposition === ALERT_DISPOSITION.ManualFix"
        label="处理说明"
        required
      >
        <a-textarea
          v-model:value="remark"
          :rows="3"
          placeholder="修复了哪些配置/环境，续扫从哪个检查点开始…"
        />
      </a-form-item>

      <a-form-item
        v-else-if="disposition === ALERT_DISPOSITION.AcceptRisk"
        label="接受原因"
        required
      >
        <a-textarea
          v-model:value="remark"
          :rows="3"
          placeholder="说明为何接受该风险…"
        />
        <a-checkbox v-model:checked="notifyAuditor" class="notify-checkbox">
          通知审计员（处置归档）
        </a-checkbox>
      </a-form-item>

      <template v-else-if="disposition === ALERT_DISPOSITION.FalsePositive">
        <a-form-item label="误报说明">
          <a-textarea
            v-model:value="remark"
            :rows="2"
            placeholder="说明误判原因…"
          />
        </a-form-item>
        <a-checkbox v-model:checked="notifyAuditor" class="notify-checkbox">
          通知审计员（误报归档）
        </a-checkbox>
      </template>

      <template v-else-if="disposition === ALERT_DISPOSITION.AutoRecover">
        <a-form-item label="处理说明">
          <a-textarea
            v-model:value="remark"
            :rows="3"
            placeholder="可选：补充备注…"
          />
        </a-form-item>
        <a-checkbox v-model:checked="notifyTaskOwner" class="notify-checkbox">
          通知关联任务负责人
        </a-checkbox>
      </template>

      <template v-else-if="disposition === ALERT_DISPOSITION.TempMitigate">
        <a-form-item label="处理说明">
          <a-textarea v-model:value="remark" :rows="2" placeholder="可选备注…" />
        </a-form-item>
        <a-checkbox v-model:checked="notifyOps" class="notify-checkbox">
          通知运维值班
        </a-checkbox>
      </template>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { getAlertAssigneeOptions, getAlertDetail, handleAlert } from '@/api/system'
import { useAuthStore } from '@/stores/auth'
import type { AlertDisposition, AlertListItem } from '@/types/system'
import { ALERT_DISPOSITION } from '@/types/system'
import {
  ALERT_DISPOSITION_OPTIONS,
  getAlertDispositionFollowUp,
  isAlertRemarkRequired,
} from '@/utils/alertDisposition'

const visible = defineModel<boolean>('open', { required: true })

const props = defineProps<{
  alert: AlertListItem | null
}>()

const emit = defineEmits<{
  success: [movedToHandled: boolean]
}>()

const authStore = useAuthStore()
const submitting = ref(false)
const disposition = ref<AlertDisposition | undefined>(undefined)
const remark = ref('')
const assigneeUserId = ref<string | undefined>(undefined)
const plannedCompleteAt = ref<Dayjs | undefined>(dayjs().add(8, 'hour'))
const notifyAuditor = ref(true)
const notifyTaskOwner = ref(false)
const notifyOps = ref(false)
const relatedTaskName = ref<string | undefined>(undefined)
const assigneeSelectOptions = ref<{ value: string; label: string }[]>([])

const dispositionOptions = ALERT_DISPOSITION_OPTIONS.map((item) => ({
  value: item.value,
  label: item.label,
}))

/** 当前处置方式的后续动作预览 */
const followUp = computed(() =>
  disposition.value
    ? getAlertDispositionFollowUp(disposition.value, relatedTaskName.value)
    : null,
)

/** 打开弹窗时重置表单并拉取关联任务名、转派候选人 */
async function initForm() {
  disposition.value = undefined
  remark.value = ''
  assigneeUserId.value = undefined
  plannedCompleteAt.value = dayjs().add(8, 'hour')
  notifyAuditor.value = true
  notifyTaskOwner.value = false
  notifyOps.value = false
  relatedTaskName.value = undefined

  const [assigneeRes] = await Promise.all([
    getAlertAssigneeOptions(),
    props.alert ? loadRelatedTaskName(props.alert.alertId) : Promise.resolve(),
  ])
  assigneeSelectOptions.value = assigneeRes.data.map((item) => ({
    value: item.userId,
    label: item.label,
  }))
  if (assigneeSelectOptions.value.length > 0) {
    assigneeUserId.value = assigneeSelectOptions.value[0].value
  }
}

/** 拉取详情中的关联任务名，用于后续动作文案 */
async function loadRelatedTaskName(alertId: string) {
  try {
    const res = await getAlertDetail(alertId)
    relatedTaskName.value = res.data.relatedTask?.taskName
  } catch {
    relatedTaskName.value = undefined
  }
}

/** 校验并提交处置请求 */
async function handleSubmit() {
  if (!props.alert) {
    return Promise.reject()
  }
  if (!disposition.value) {
    message.warning('请选择处理方式')
    return Promise.reject()
  }
  if (isAlertRemarkRequired(disposition.value) && !remark.value.trim()) {
    message.warning(
      disposition.value === ALERT_DISPOSITION.AcceptRisk
        ? '请填写接受原因'
        : '请填写处理说明',
    )
    return Promise.reject()
  }
  if (
    disposition.value === ALERT_DISPOSITION.TransferReview &&
    !assigneeUserId.value
  ) {
    message.warning('请选择指派负责人')
    return Promise.reject()
  }

  submitting.value = true
  try {
    const handlerName = authStore.userInfo?.realName ?? '当前用户'
    const res = await handleAlert(
      props.alert.alertId,
      {
        disposition: disposition.value,
        remark: remark.value.trim() || undefined,
        assigneeUserId: assigneeUserId.value,
        plannedCompleteAt: plannedCompleteAt.value?.toISOString(),
        notifyAuditor: notifyAuditor.value,
        notifyTaskOwner: notifyTaskOwner.value,
        notifyOps: notifyOps.value,
      },
      handlerName,
    )
    if (res.data.movedToHandled) {
      message.success('处置已提交，可在已处理列表查看处理时间线')
    } else {
      message.success('已标为已读，告警仍保留在未处理')
    }
    visible.value = false
    emit('success', res.data.movedToHandled)
  } finally {
    submitting.value = false
  }
}

watch(
  () => [visible.value, props.alert?.alertId] as const,
  ([open]) => {
    if (open) {
      initForm()
    }
  },
)
</script>

<style scoped>
.alert-handle-form {
  margin-top: 8px;
}

.form-hint {
  margin: 8px 0 0;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.45);
}

.follow-up-card {
  margin-bottom: 16px;
  background: #fafafa;
}

.follow-up-title {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 600;
}

.follow-up-line {
  margin: 0 0 6px;
  color: rgba(0, 0, 0, 0.65);
}

.follow-up-line:last-child {
  margin-bottom: 0;
}

.notify-hint {
  margin: -8px 0 16px;
}

.notify-checkbox {
  margin-top: 8px;
}

.modal-select-full {
  width: 100%;
}
</style>
