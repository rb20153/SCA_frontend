<template>
  <div class="page-container policy-editor-page">
    <div class="page-actions">
      <a-button type="primary">保存草稿</a-button>
      <a-button>提交发布申请</a-button>
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
        <PolicyJsonEditorPanel v-model="editorContent" />
        <PolicyConfigPreviewPanel
          :loading="false"
          :parse-result="parseResult"
        />
      </div>
    </PageLoading>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPolicyEditorContent } from '@/api/policy'
import PageLoading from '@/components/common/PageLoading.vue'
import PolicyConfigPreviewPanel from '@/components/policy/PolicyConfigPreviewPanel.vue'
import PolicyJsonEditorPanel from '@/components/policy/PolicyJsonEditorPanel.vue'
import type { PolicyConfigParseResult } from '@/types/policy'
import { parsePolicyEditorConfig } from '@/utils/policyConfigParse'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const loadFailed = ref(false)
const editorContent = ref('')
const parseResult = ref<PolicyConfigParseResult | null>(null)

/** 配置文本已加载且可挂载编辑器工作区 */
const contentReady = computed(() => !loading.value && !loadFailed.value)

let parseTimer: ReturnType<typeof setTimeout> | null = null

/** 根据路由 policyId 拉取编辑器初始内容 */
async function fetchEditorContent() {
  const policyId = String(route.params.policyId ?? '')
  loading.value = true
  loadFailed.value = false

  try {
    const res = await getPolicyEditorContent(policyId)
    if (!res.data) {
      loadFailed.value = true
      editorContent.value = ''
      parseResult.value = null
      return
    }
    editorContent.value = res.data
    parseResult.value = parsePolicyEditorConfig(res.data)
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

/* 打通 a-spin 整条高度链：根 → spin-container → slot 包裹层，逐层 flex:1 撑满 */
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
  /* 兜底高度：即使外层 flex 链失效，也保证工作区足够高占满视口 */
  min-height: calc(100vh - 56px - 48px - 32px - 16px);
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
  gap: 16px;
}
</style>
