<template>
  <a-modal
    v-model:open="visible"
    title="处理时间线"
    :footer="null"
    width="720px"
    destroy-on-close
    :body-style="{ padding: '24px' }"
    wrap-class-name="alert-timeline-modal"
  >
    <div class="alert-timeline-modal__content">
      <a-spin :spinning="loading" tip="加载中..." size="large">
        <div class="alert-timeline-modal__spin-body">
          <template v-if="timeline">
            <p class="timeline-intro">
              告警：<strong>{{ timeline.title }}</strong> · 处理人：{{ timeline.handlerName }}
            </p>
            <div class="alert-timeline-modal__timeline-scroll">
              <ChainTimeline :items="timeline.timeline" />
            </div>
          </template>
          <a-empty v-else-if="!loading" class="alert-timeline-modal__empty" description="暂无处理时间线" />
        </div>
      </a-spin>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { getAlertTimeline } from '@/api/system'
import ChainTimeline from '@/components/common/ChainTimeline.vue'
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
/** 固定内容区高度，加载前后弹窗尺寸一致 */
.alert-timeline-modal__content {
  height: 480px;
}

.alert-timeline-modal__content :deep(.ant-spin-nested-loading) {
  height: 100%;
}

.alert-timeline-modal__content :deep(.ant-spin-container) {
  height: 100%;
}

/** 占位容器保证 loading 时内容区高度不变 */
.alert-timeline-modal__spin-body {
  height: 480px;
  display: flex;
  flex-direction: column;
}

.timeline-intro {
  flex-shrink: 0;
  margin: 0 0 16px;
  color: rgba(0, 0, 0, 0.65);
}

/** 时间线区域固定高度，内容超出时在内部滚动 */
.alert-timeline-modal__timeline-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
}

.alert-timeline-modal__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  margin: 0;
}
</style>
