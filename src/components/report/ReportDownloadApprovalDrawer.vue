<template>
  <a-drawer v-model:open="visible" title="报告下载审批" placement="right" :width="960" destroy-on-close>
    <div class="approval-drawer-content">
      <PageLoading :loading="loading" class="approval-drawer-loading">
        <template v-if="application">
          <a-descriptions bordered size="small" :column="2" class="detail-desc">
            <a-descriptions-item label="申请人">{{ application.applicantName }}</a-descriptions-item>
            <a-descriptions-item label="申请时间">{{ formatReportDateTime(application.createdAt) }}</a-descriptions-item>
            <a-descriptions-item label="下载格式">{{ application.format.toUpperCase() }}</a-descriptions-item>
            <a-descriptions-item label="包含证据链">{{ application.includeEvidenceChain ? '是' : '否' }}</a-descriptions-item>
            <a-descriptions-item label="申请原因" :span="2">{{ application.reason }}</a-descriptions-item>
          </a-descriptions>
          <section class="preview-section">
            <h4 class="section-title">报告预览</h4>
            <ReportPreviewViewer :report-id="application.reportId" :active="visible" class="report-preview" />
          </section>
          <section class="approval-section" aria-labelledby="report-approval-title">
            <a-divider class="approval-section__divider" />
            <h4 id="report-approval-title" class="section-title approval-section__title">发布审批</h4>
            <a-form layout="vertical" class="approval-form">
              <a-row :gutter="16">
                <a-col :span="12">
                  <a-form-item label="审批结论" required>
                    <a-select v-model:value="conclusion" :options="conclusionOptions" />
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item label="审批意见" required>
                    <a-textarea v-model:value="opinion" :rows="3" placeholder="请填写审批意见" />
                  </a-form-item>
                </a-col>
              </a-row>
            </a-form>
          </section>
        </template>
      </PageLoading>
    </div>
    <template #footer><div class="drawer-footer"><a-button @click="visible = false">取消</a-button><a-button v-if="canApproveReport()" type="primary" :loading="submitting" @click="submit">提交审批</a-button></div></template>
  </a-drawer>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { approveReportDownloadApplication, getReportDownloadApplication } from '@/api/report'
import PageLoading from '@/components/common/PageLoading.vue'
import ReportPreviewViewer from '@/components/report/ReportPreviewViewer.vue'
import { usePagePermission } from '@/composables/usePagePermission'
import type { ReportDownloadApplication } from '@/types/report'
import { formatReportDateTime } from '@/utils/reportDisplay'
const props = defineProps<{ applicationId: string | null }>()
const visible = defineModel<boolean>('open', { required: true })
const emit = defineEmits<{ success: [] }>()
const { canApproveReport } = usePagePermission()
const loading = ref(false); const submitting = ref(false); const application = ref<ReportDownloadApplication | null>(null)
const conclusion = ref<'approved' | 'rejected'>('approved'); const opinion = ref('')
const conclusionOptions = [{ value: 'approved', label: '通过' }, { value: 'rejected', label: '驳回' }]
async function load() { if (!props.applicationId) return; loading.value = true; try { application.value = (await getReportDownloadApplication(props.applicationId)).data } finally { loading.value = false } }
async function submit() { if (!canApproveReport() || !application.value) return; if (!opinion.value.trim()) { message.warning('请填写审批意见'); return }; submitting.value = true; try { await approveReportDownloadApplication(application.value.applicationId, { conclusion: conclusion.value, opinion: opinion.value.trim() }); message.success(conclusion.value === 'approved' ? '审批通过' : '已驳回申请'); visible.value = false; emit('success') } catch (error) { message.error(error instanceof Error ? error.message : '审批提交失败') } finally { submitting.value = false } }
watch(() => [visible.value, props.applicationId] as const, ([open, id]) => { if (open && id) { conclusion.value = 'approved'; opinion.value = ''; void load() } if (!open) application.value = null })
</script>

<style scoped>
.section-title { margin: 20px 0 12px; font-size: 14px; font-weight: 600; }
.approval-drawer-content { height: 100%; min-height: 0; display: flex; flex-direction: column; }
.approval-drawer-loading { min-height: 0; display: flex; flex: 1; flex-direction: column; }
.approval-drawer-loading :deep(.ant-spin-container),
.approval-drawer-loading :deep(.page-loading__body) { min-height: 0; display: flex; flex: 1; flex-direction: column; }
.detail-desc { flex: none; }
.preview-section { min-height: 484px; flex: none; display: flex; flex-direction: column; margin-bottom: 0; overflow: hidden; }
.report-preview { height: 484px; min-height: 484px; flex: none; }
.report-preview :deep(.report-preview-viewer),
.report-preview :deep(.report-preview-viewer__loading),
.report-preview :deep(.report-preview-viewer__frame) { height: 484px !important; min-height: 484px !important; flex: none !important; }
.approval-section { flex: none; margin-top: 0; background: #fff; }
.approval-section__divider { margin: 24px 0 20px; }
.approval-section__title { margin: 0 0 12px; }
.approval-form { margin: 0; }
.drawer-footer { display: flex; justify-content: flex-end; gap: 8px; }
</style>
