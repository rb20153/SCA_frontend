<template>
  <a-modal
    v-model:open="visible"
    title="处理时间线"
    :footer="null"
    width="720px"
    destroy-on-close
  >
    <PageLoading :loading="loading">
      <template v-if="timeline">
        <p class="timeline-intro">
          告警：<strong>{{ timeline.title }}</strong> · 处理人：{{ timeline.handlerName }}
        </p>
        <ChainTimeline :items="timeline.timeline" />
      </template>
      <a-empty v-else-if="!loading" description="暂无处理时间线" />
    </PageLoading>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { getAlertTimeline } from '@/api/system'
import ChainTimeline from '@/components/common/ChainTimeline.vue'
import PageLoading from '@/components/common/PageLoading.vue'
import type { AlertTimeline } from '@/types/system'

const visible = defineModel<boolean>('open', { required: true })

const props = defineProps<{
  alertId: string | null
}>()

const loading = ref(false)
const timeline = ref<AlertTimeline | null>(null)

/** 打开弹窗时从接口拉取处理时间线 */
async function fetchTimeline(alertId: string) {
  loading.value = true
  timeline.value = null
  try {
    const res = await getAlertTimeline(alertId)
    timeline.value = res.data
  } catch {
    timeline.value = null
  } finally {
    loading.value = false
  }
}

watch(
  () => [visible.value, props.alertId] as const,
  ([open, alertId]) => {
    if (open && alertId) {
      fetchTimeline(alertId)
    }
    if (!open) {
      timeline.value = null
    }
  },
)
</script>

<style scoped>
.timeline-intro {
  margin: 0 0 16px;
  color: rgba(0, 0, 0, 0.65);
}
</style>
