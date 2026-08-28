<template>
  <a-card :bordered="false" class="risk-detail-head">
    <div class="risk-detail-head__grid">
      <div class="risk-detail-head__item">
        <span class="risk-detail-head__label">项目名称</span>
        <strong class="risk-detail-head__value risk-detail-head__value--emphasis">
          {{ headInfo.projectName }}
        </strong>
      </div>
      <div class="risk-detail-head__item">
        <span class="risk-detail-head__label">任务名称</span>
        <span class="risk-detail-head__value">{{ headInfo.taskName }}</span>
      </div>
      <div class="risk-detail-head__item">
        <span class="risk-detail-head__label">状态</span>
        <span class="risk-detail-head__value">
          <a-tag :color="TASK_STATUS_COLOR[headInfo.status]" class="risk-detail-head__tag">
            {{ TASK_STATUS_LABEL[headInfo.status] }}
          </a-tag>
        </span>
      </div>
      <div class="risk-detail-head__item">
        <span class="risk-detail-head__label">数据来源</span>
        <span class="risk-detail-head__value">{{ headInfo.dataSourceLabel }}</span>
      </div>
    </div>
  </a-card>
</template>

<script setup lang="ts">
import { TASK_STATUS_COLOR, TASK_STATUS_LABEL } from '@/types/common'
import type { OpenSourceRiskDetailHeadInfo } from '@/types/detect'

const props = defineProps<{
  /** 顶部任务与项目摘要 */
  headInfo: OpenSourceRiskDetailHeadInfo
}>()

</script>

<style scoped>
.risk-detail-head {
  margin-bottom: 16px;
}

.risk-detail-head__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px 24px;
}

.risk-detail-head__item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.risk-detail-head__label {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.45);
  line-height: 22px;
}

.risk-detail-head__value {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.88);
  line-height: 22px;
  word-break: break-word;
}

.risk-detail-head__value--emphasis {
  font-size: 16px;
  font-weight: 600;
}

.risk-detail-head__tag {
  margin-inline-end: 0;
}

@media (max-width: 1400px) {
  .risk-detail-head__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 992px) {
  .risk-detail-head__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 576px) {
  .risk-detail-head__grid {
    grid-template-columns: 1fr;
  }
}
</style>
