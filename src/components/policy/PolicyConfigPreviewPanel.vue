<template>
  <a-card class="policy-preview-card" :bordered="false">
    <template #title>动态解析表单</template>

    <a-spin :spinning="loading">
      <a-alert
        v-if="parseResult && !parseResult.ok"
        type="error"
        show-icon
        class="policy-preview-card__alert"
        :message="parseResult.title"
        :description="parseFailureDescription"
      />

      <div v-else-if="config" class="policy-preview-fields">
        <div class="policy-preview-field">
          <span class="policy-preview-field__label">策略名称</span>
          <span class="policy-preview-field__value">
            {{ config.name.trim() || '（未填写）' }}
          </span>
        </div>
        <div class="policy-preview-field">
          <span class="policy-preview-field__label">相似度阈值</span>
          <span class="policy-preview-field__value">{{ config.similarity_threshold }}</span>
        </div>
        <div class="policy-preview-field">
          <span class="policy-preview-field__label">最小匹配长度</span>
          <span class="policy-preview-field__value">{{ config.min_match_len }}</span>
        </div>
        <div class="policy-preview-field policy-preview-field--folders">
          <span class="policy-preview-field__label">排除目录</span>
          <div class="policy-preview-field__folder-list">
            <a-tag
              v-for="folder in config.excluded_folders"
              :key="folder"
              class="policy-preview-field__folder-tag"
            >
              {{ folder }}
            </a-tag>
            <span
              v-if="config.excluded_folders.length === 0"
              class="policy-preview-field__value"
            >
              （无）
            </span>
          </div>
        </div>
        <div class="policy-preview-field">
          <span class="policy-preview-field__label">失败自动重试</span>
          <span class="policy-preview-field__value">
            {{ formatPolicyRetryEnabled(config.retry.enabled) }}
          </span>
        </div>
        <div class="policy-preview-field">
          <span class="policy-preview-field__label">重试次数</span>
          <span class="policy-preview-field__value">{{ config.retry.count }}</span>
        </div>
        <div class="policy-preview-field">
          <span class="policy-preview-field__label">输出格式</span>
          <span class="policy-preview-field__value">{{ config.output_format }}</span>
        </div>
      </div>

      <a-empty
        v-else-if="!loading"
        description="等待配置加载"
        class="policy-preview-card__empty"
      />
    </a-spin>
  </a-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PolicyConfigParseResult } from '@/types/policy'
import { formatPolicyRetryEnabled } from '@/utils/policyDisplay'

const props = defineProps<{
  loading: boolean
  parseResult: PolicyConfigParseResult | null
}>()

const config = computed(() => (props.parseResult?.ok ? props.parseResult.config : null))

/** 解析失败时的描述区：原因 + 引导列表 */
const parseFailureDescription = computed(() => {
  if (!props.parseResult || props.parseResult.ok) {
    return ''
  }
  const hints = props.parseResult.hints.map((item) => `· ${item}`).join('\n')
  return `${props.parseResult.message}\n\n${hints}`
})
</script>

<style scoped>
.policy-preview-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.policy-preview-card :deep(.ant-card-head) {
  min-height: 48px;
}

.policy-preview-card :deep(.ant-card-body) {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.policy-preview-card__alert {
  margin-bottom: 0;
}

.policy-preview-card__alert :deep(.ant-alert-description) {
  white-space: pre-line;
}

.policy-preview-fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.policy-preview-field {
  display: grid;
  grid-template-columns: 108px minmax(0, 1fr);
  column-gap: 16px;
  align-items: start;
}

.policy-preview-field__label {
  color: rgba(0, 0, 0, 0.45);
  font-size: 14px;
  line-height: 22px;
}

.policy-preview-field__value {
  color: rgba(0, 0, 0, 0.88);
  font-size: 14px;
  line-height: 22px;
  word-break: break-all;
}

.policy-preview-field__folder-list {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.policy-preview-field__folder-tag {
  margin: 0;
}

.policy-preview-card__empty {
  margin-top: 48px;
}
</style>
