<template>
  <div v-if="diffData" class="policy-diff-split">
    <div class="policy-diff-pane">
      <div class="policy-diff-pane__head">
        旧版本 · {{ diffData.left.versionNo }}（{{ formatStatus(diffData.left.status) }}）
      </div>
      <div class="policy-diff-pane__body">
        <CodeSnippetBlock :content="diffData.left.configSummary" />
      </div>
    </div>

    <div class="policy-diff-pane">
      <div class="policy-diff-pane__head">
        新版本 · {{ diffData.right.versionNo }}（{{ formatStatus(diffData.right.status) }}）
      </div>
      <div class="policy-diff-pane__body">
        <CodeSnippetBlock :content="diffData.right.configSummary" />
      </div>
    </div>
  </div>

  <a-result
    v-else-if="loadFailed"
    status="warning"
    title="无法加载差异对比"
    sub-title="未找到可对比的版本"
    class="policy-diff-empty"
  />
</template>

<script setup lang="ts">
import CodeSnippetBlock from '@/components/common/CodeSnippetBlock.vue'
import type { PolicyVersionDiffResult, PolicyVersionListItem } from '@/types/policy'
import { POLICY_VERSION_STATUS_LABEL } from '@/utils/policyVersionDisplay'

defineProps<{
  diffData: PolicyVersionDiffResult | null
  loadFailed?: boolean
}>()

/** 格式化版本状态为面板标题展示 */
function formatStatus(status: PolicyVersionListItem['status']): string {
  return POLICY_VERSION_STATUS_LABEL[status]
}
</script>

<style scoped>
.policy-diff-split {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  align-items: stretch;
}

.policy-diff-pane {
  display: flex;
  flex-direction: column;
  min-height: 280px;
}

.policy-diff-pane__head {
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.88);
}

.policy-diff-pane__body {
  flex: 1;
  min-height: 0;
  display: flex;
}

.policy-diff-pane__body :deep(.code-snippet-block) {
  flex: 1;
  width: 100%;
  min-height: 240px;
  max-height: 320px;
  overflow: auto;
  margin: 0;
}

.policy-diff-empty {
  padding: 24px 0;
}

@media (max-width: 768px) {
  .policy-diff-split {
    grid-template-columns: 1fr;
  }
}
</style>
