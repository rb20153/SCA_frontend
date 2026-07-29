<template>
  <div class="code-evidence-card">
    <AutonomyEvidenceMetaRow
      :alert-label="alertLabel"
      :alert-color="alertTagColor"
      :confidence="evidence.confidence"
      :source-project="evidence.sourceProject"
      :source-url="evidence.sourceUrl"
      :source-version="evidence.sourceVersion"
      :license="evidence.license"
    />

    <div v-if="evidence.tamperAnalysis || evidence.suggestion" class="analysis-block">
      <p v-if="evidence.tamperAnalysis" class="analysis-line">
        <span class="analysis-label">解析摘要：</span>{{ evidence.tamperAnalysis }}
      </p>
      <p v-if="evidence.suggestion" class="analysis-line">
        <span class="analysis-label">建议：</span>{{ evidence.suggestion }}
      </p>
    </div>

    <div class="diff-split">
      <div class="diff-pane">
        <div class="diff-pane-head">{{ evidence.currentCode.paneTitle }}</div>
        <CodeSnippetBlock :lines="evidence.currentCode.lines" />
      </div>
      <div class="diff-pane">
        <div class="diff-pane-head">{{ evidence.suspectedCode.paneTitle }}</div>
        <CodeSnippetBlock :lines="evidence.suspectedCode.lines" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import CodeSnippetBlock from '@/components/common/CodeSnippetBlock.vue'
import AutonomyEvidenceMetaRow from '@/components/detect/AutonomyEvidenceMetaRow.vue'
import type { AutonomyCodeEvidenceItem } from '@/types/detect'
import {
  AUTONOMY_CODE_ALERT_TYPE_COLOR,
  AUTONOMY_CODE_ALERT_TYPE_LABEL,
} from '@/utils/autonomyDetectResultDisplay'

const props = defineProps<{
  /** 单条代码检测证据（含 diff 双栏） */
  evidence: AutonomyCodeEvidenceItem
}>()

/** 告警类型 Tag 颜色 */
const alertTagColor = computed(
  () => AUTONOMY_CODE_ALERT_TYPE_COLOR[props.evidence.alertType],
)

/** 告警类型展示文案 */
const alertLabel = computed(
  () => AUTONOMY_CODE_ALERT_TYPE_LABEL[props.evidence.alertType],
)
</script>

<style scoped>
.code-evidence-card {
  display: flex;
  flex-direction: column;
  /* 单条代码证据整体高度 ≥ 1.8 条指纹证据占位高度 */
  min-height: calc(var(--evidence-fp-item-height, 168px) * 1.8);
}

.analysis-block {
  margin-bottom: 12px;
}

.analysis-line {
  margin: 0 0 6px;
  font-size: 13px;
  line-height: 1.6;
  color: rgba(0, 0, 0, 0.65);
}

.analysis-line:last-child {
  margin-bottom: 0;
}

.analysis-label {
  color: rgba(0, 0, 0, 0.45);
}

.diff-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  flex: 1;
}

.diff-pane {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.diff-pane-head {
  flex-shrink: 0;
  margin-bottom: 8px;
  padding: 0 4px;
  font-size: 12px;
  font-weight: 500;
  text-align: center;
  color: rgba(0, 0, 0, 0.65);
}

.diff-pane :deep(.code-snippet-block) {
  flex: 1;
  min-height: 200px;
}

@media (max-width: 992px) {
  .diff-split {
    grid-template-columns: 1fr;
  }
}
</style>
