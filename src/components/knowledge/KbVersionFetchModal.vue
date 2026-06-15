<template>
  <a-modal
    v-model:open="visible"
    title="获取更新"
    width="480px"
    destroy-on-close
    :footer="footerVisible ? undefined : null"
    :closable="!loading"
    :mask-closable="!loading"
    @ok="handleOk"
  >
    <a-spin :spinning="loading">
      <div class="fetch-body">
        <template v-if="!loading && result">
          <p class="fetch-success">
            获取成功，更新包大小
            <strong>{{ formatKbVersionPackageSizeGb(result.packageSizeGb) }}</strong>
            ，预计需要
            <strong>{{ result.estimatedMinutes }} 分钟</strong>
            完成索引构建。
          </p>
          <p v-if="result.message" class="fetch-hint">{{ result.message }}</p>
        </template>
      </div>
    </a-spin>

    <template v-if="footerVisible" #footer>
      <a-button type="primary" @click="handleOk">确定</a-button>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { fetchKbVersionUpdate } from '@/api/knowledge'
import type { FetchKbVersionUpdateResult } from '@/types/knowledge'
import { formatKbVersionPackageSizeGb } from '@/utils/knowledgeVersionDisplay'

const visible = defineModel<boolean>('open', { required: true })

const props = defineProps<{
  kbProjectId: string
}>()

const loading = ref(false)
const result = ref<FetchKbVersionUpdateResult | null>(null)

/** 请求完成后才显示底部确定按钮 */
const footerVisible = computed(() => !loading.value && result.value !== null)

/** 重置状态 */
function resetState() {
  loading.value = false
  result.value = null
}

/** 向后端请求获取更新 */
async function loadFetchResult() {
  if (!props.kbProjectId) {
    return
  }

  loading.value = true
  result.value = null
  try {
    const res = await fetchKbVersionUpdate(props.kbProjectId)
    result.value = res.data
  } catch {
    visible.value = false
  } finally {
    loading.value = false
  }
}

/** 确定后关闭弹窗 */
function handleOk() {
  visible.value = false
}

watch(
  () => visible.value,
  (open) => {
    if (open) {
      resetState()
      loadFetchResult()
    }
  },
)
</script>

<style scoped>
.fetch-body {
  min-height: 80px;
}

.fetch-success {
  margin: 0;
  color: rgba(0, 0, 0, 0.88);
  line-height: 1.7;
}

.fetch-hint {
  margin: 12px 0 0;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.45);
  line-height: 1.6;
}
</style>
