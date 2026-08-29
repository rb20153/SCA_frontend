<template>
  <a-drawer
    v-model:open="visible"
    title="发布审批"
    placement="right"
    :width="960"
    destroy-on-close
  >
    <PageLoading :loading="loading">
      <template v-if="version">
        <div class="approval-info">
          <div class="approval-info__row">
            <span class="approval-info__label">申请版本</span>
            <span class="approval-info__value">{{ version.versionNo }}</span>
          </div>
          <div class="approval-info__row">
            <span class="approval-info__label">申请人</span>
            <span class="approval-info__value">{{ version.creatorName }}</span>
          </div>
          <div class="approval-info__row approval-info__row--block">
            <span class="approval-info__label">变更摘要</span>
            <DetailText :text="version.changeSummary" class="approval-info__summary" />
          </div>
        </div>

        <h4 class="section-title">差异对比</h4>
        <PolicyVersionDiffPanels :diff-data="diffData" :load-failed="diffLoadFailed" />

        <h4 class="section-title">发布审批</h4>
        <a-form layout="vertical" class="approval-form">
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="审批结论" required>
                <a-select
                  v-model:value="conclusion"
                  :options="POLICY_VERSION_APPROVAL_CONCLUSION_OPTIONS"
                />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="生效时间" required>
                <a-select
                  v-model:value="effectiveTime"
                  :options="POLICY_VERSION_EFFECTIVE_TIME_OPTIONS"
                />
              </a-form-item>
            </a-col>
          </a-row>

          <a-form-item label="审批意见" required>
            <a-textarea
              v-model:value="opinion"
              :rows="3"
              placeholder="填写审批意见…"
            />
          </a-form-item>
        </a-form>
      </template>
    </PageLoading>

    <template #footer>
      <div class="approval-drawer-footer">
        <a-button @click="handleCancel">取消</a-button>
        <a-button v-if="canApprovePolicy()" type="primary" :loading="submitting" @click="handleSubmit">
          提交审批
        </a-button>
      </div>
    </template>
  </a-drawer>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { getPolicyVersionDiff, submitPolicyVersionApproval } from '@/api/policy'
import DetailText from '@/components/common/DetailText.vue'
import PageLoading from '@/components/common/PageLoading.vue'
import PolicyVersionDiffPanels from '@/components/policy/PolicyVersionDiffPanels.vue'
import type {
  PolicyVersionApprovalConclusion,
  PolicyVersionDiffResult,
  PolicyVersionEffectiveTime,
  PolicyVersionListItem,
} from '@/types/policy'
import {
  POLICY_VERSION_APPROVAL_CONCLUSION_OPTIONS,
  POLICY_VERSION_EFFECTIVE_TIME_OPTIONS,
} from '@/utils/policyVersionDisplay'
import { usePagePermission } from '@/composables/usePagePermission'

const props = defineProps<{
  /** 策略 ID */
  policyId: string
  /** 待审批版本行 */
  version: PolicyVersionListItem | null
}>()

const visible = defineModel<boolean>('open', { required: true })
const { canApprovePolicy } = usePagePermission()

const emit = defineEmits<{
  success: []
}>()

const loading = ref(false)
const submitting = ref(false)
const diffLoadFailed = ref(false)
const diffData = ref<PolicyVersionDiffResult | null>(null)
const conclusion = ref<PolicyVersionApprovalConclusion>('approved')
const opinion = ref('')
const effectiveTime = ref<PolicyVersionEffectiveTime>('immediate')

/** 抽屉关闭时重置表单与差异数据 */
function resetForm() {
  diffData.value = null
  diffLoadFailed.value = false
  conclusion.value = 'approved'
  opinion.value = ''
  effectiveTime.value = 'immediate'
}

/** 打开抽屉时拉取差异对比数据 */
async function fetchDiffData() {
  if (!props.version) {
    return
  }

  loading.value = true
  diffLoadFailed.value = false
  diffData.value = null

  try {
    const res = await getPolicyVersionDiff(props.policyId, props.version.versionId)
    if (!res.data) {
      diffLoadFailed.value = true
      return
    }
    diffData.value = res.data
  } finally {
    loading.value = false
  }
}

/** 关闭审批抽屉 */
function handleCancel() {
  visible.value = false
}

/** 校验并提交审批结论 */
async function handleSubmit() {
  if (!canApprovePolicy()) return
  if (!props.version) {
    return
  }

  const trimmedOpinion = opinion.value.trim()
  if (!trimmedOpinion) {
    message.warning('请填写审批意见')
    return
  }

  submitting.value = true
  try {
    const res = await submitPolicyVersionApproval({
      policyId: props.policyId,
      versionId: props.version.versionId,
      conclusion: conclusion.value,
      opinion: trimmedOpinion,
      effectiveTime: effectiveTime.value,
    })

    const result = res.data
    if (result.conclusion === 'rejected') {
      message.success('已驳回该发布申请')
    } else if (result.effectiveTime === 'next-window') {
      message.success('审批通过，将在下次发布窗口生效')
    } else {
      message.success('审批通过，策略已立即生效')
    }

    visible.value = false
    emit('success')
  } catch (error) {
    const msg = error instanceof Error ? error.message : '审批提交失败，请稍后重试'
    message.error(msg)
  } finally {
    submitting.value = false
  }
}

watch(
  () => [visible.value, props.version?.versionId] as const,
  ([open, versionId]) => {
    if (open && versionId) {
      void fetchDiffData()
    }
    if (!open) {
      resetForm()
    }
  },
)
</script>

<style scoped>
.approval-info {
  margin-bottom: 20px;
  padding: 16px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
}

.approval-info__row {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.approval-info__row:last-child {
  margin-bottom: 0;
}

.approval-info__row--block {
  flex-direction: column;
  gap: 8px;
}

.approval-info__label {
  flex-shrink: 0;
  min-width: 72px;
  color: rgba(0, 0, 0, 0.45);
}

.approval-info__value {
  color: rgba(0, 0, 0, 0.88);
  word-break: break-word;
}

.approval-info__summary {
  width: 100%;
}

.section-title {
  margin: 20px 0 12px;
  font-size: 15px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.88);
}

.section-title:first-of-type {
  margin-top: 0;
}

.approval-form {
  margin-top: 8px;
}

.approval-drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
