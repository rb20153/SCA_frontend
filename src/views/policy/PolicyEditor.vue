<template>
  <div class="page-container policy-editor-page">
    <div class="page-actions">
      <a-button v-if="canWrite('/policies')" type="primary" @click="openPublishModal">提交发布申请</a-button>
    </div>

    <PageLoading :loading="loading" class="policy-editor-page__body">
      <a-result
        v-if="!loading && loadFailed"
        status="warning"
        title="无法加载策略配置"
        sub-title="未找到该策略或配置尚未发布，请返回列表重试"
      >
        <template #extra>
          <a-button type="primary" @click="router.push('/policies')">返回策略列表</a-button>
        </template>
      </a-result>

      <div v-else-if="contentReady" class="policy-editor-page__workspace">
        <PolicyJsonEditorPanel v-model="editorContent" :readonly="!canWrite('/policies')" />
        <PolicyConfigPreviewPanel
          :loading="false"
          :parse-result="parseResult"
        />
      </div>
    </PageLoading>

    <PolicyPublishApplyModal
      v-model:open="publishModalVisible"
      :current-version="currentVersion"
      :submitting="submitting"
      @submit="handlePublishSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { getPolicyEditorContent, submitPolicyPublishApplication } from '@/api/policy'
import PageLoading from '@/components/common/PageLoading.vue'
import PolicyConfigPreviewPanel from '@/components/policy/PolicyConfigPreviewPanel.vue'
import PolicyJsonEditorPanel from '@/components/policy/PolicyJsonEditorPanel.vue'
import PolicyPublishApplyModal from '@/components/policy/PolicyPublishApplyModal.vue'
import { useAuthStore } from '@/stores/auth'
import type { PolicyConfigParseResult } from '@/types/policy'
import { parsePolicyEditorConfig } from '@/utils/policyConfigParse'
import { usePagePermission } from '@/composables/usePagePermission'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { canWrite } = usePagePermission()

const loading = ref(true)
const loadFailed = ref(false)
const editorContent = ref('')
const currentVersion = ref<string | null>(null)
const parseResult = ref<PolicyConfigParseResult | null>(null)
const publishModalVisible = ref(false)
const submitting = ref(false)

/** 路由中的策略 ID，新建时为 `new` */
const policyId = computed(() => String(route.params.policyId ?? ''))

/** 配置文本已加载且可挂载编辑器工作区 */
const contentReady = computed(() => !loading.value && !loadFailed.value)

let parseTimer: ReturnType<typeof setTimeout> | null = null

/** 根据路由 policyId 拉取编辑器初始内容与当前生效版本 */
async function fetchEditorContent() {
  loading.value = true
  loadFailed.value = false

  try {
    const res = await getPolicyEditorContent(policyId.value)
    if (!res.data) {
      loadFailed.value = true
      editorContent.value = ''
      currentVersion.value = null
      parseResult.value = null
      return
    }

    editorContent.value = res.data.configText
    currentVersion.value = res.data.currentVersion
    parseResult.value = parsePolicyEditorConfig(res.data.configText)
  } finally {
    loading.value = false
  }
}

/** 编辑器内容变化后防抖解析，驱动右侧预览 */
function scheduleParse(text: string) {
  if (parseTimer !== null) {
    clearTimeout(parseTimer)
  }
  parseTimer = setTimeout(() => {
    parseResult.value = parsePolicyEditorConfig(text)
    parseTimer = null
  }, 200)
}

/** 打开提交发布申请弹窗前校验 JSON 配置与策略名称 */
function openPublishModal() {
  if (!canWrite('/policies')) return
  const parsed = parsePolicyEditorConfig(editorContent.value)
  if (!parsed.ok) {
    message.warning(parsed.title)
    return
  }

  if (!parsed.config.name.trim()) {
    message.warning('策略名称不能为空')
    return
  }

  publishModalVisible.value = true
}

/**
 * 提交发布申请：携带配置文本与当前编辑人 ID
 * @param payload - 弹窗填写的版本号与变更摘要
 */
async function handlePublishSubmit(payload: {
  versionNo: string
  changeSummary: string
}) {
  if (!canWrite('/policies')) return
  const editorId = authStore.userInfo?.userId
  if (!editorId) {
    message.error('无法获取当前用户信息，请重新登录')
    return
  }

  const parsed = parsePolicyEditorConfig(editorContent.value)
  if (!parsed.ok || !parsed.config.name.trim()) {
    message.warning('请先修正策略配置，并填写策略名称')
    return
  }

  submitting.value = true
  try {
    await submitPolicyPublishApplication({
      policyId: policyId.value,
      versionNo: payload.versionNo,
      changeSummary: payload.changeSummary,
      configText: editorContent.value,
      editorId,
    })
    publishModalVisible.value = false
    message.success('发布申请已提交')
    await router.push('/policies')
  } catch (error) {
    const msg = error instanceof Error ? error.message : '提交失败，请稍后重试'
    message.error(msg)
  } finally {
    submitting.value = false
  }
}

watch(editorContent, (text) => {
  if (loading.value) {
    return
  }
  scheduleParse(text)
})

watch(
  () => route.params.policyId,
  () => {
    void fetchEditorContent()
  },
)

onMounted(() => {
  void fetchEditorContent()
})

onUnmounted(() => {
  if (parseTimer !== null) {
    clearTimeout(parseTimer)
    parseTimer = null
  }
})
</script>

<style scoped>
.page-container {
  min-height: calc(100vh - 56px - 48px);
  display: flex;
  flex-direction: column;
}

.page-actions {
  display: flex;
  justify-content: flex-start;
  gap: 8px;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.policy-editor-page__body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.policy-editor-page__body :deep(.page-loading),
.policy-editor-page__body :deep(.page-loading .ant-spin-container),
.policy-editor-page__body :deep(.page-loading__body) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.policy-editor-page__workspace {
  flex: 1;
  min-height: calc(100vh - 56px - 48px - 32px - 16px);
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
  gap: 16px;
}
</style>
