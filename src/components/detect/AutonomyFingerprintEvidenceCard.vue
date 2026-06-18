<template>
  <div class="fingerprint-evidence-card">
    <AutonomyEvidenceMetaRow
      :alert-label="alertLabel"
      :alert-color="alertTagColor"
      :confidence="evidence.confidence"
      :source-project="evidence.sourceProject"
      :source-version="evidence.sourceVersion"
    />
    <p class="fp-description">{{ evidence.description }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AutonomyEvidenceMetaRow from '@/components/detect/AutonomyEvidenceMetaRow.vue'
import type { AutonomyFingerprintEvidenceItem } from '@/types/detect'
import {
  AUTONOMY_FINGERPRINT_ALERT_TYPE_COLOR,
  AUTONOMY_FINGERPRINT_ALERT_TYPE_LABEL,
} from '@/utils/autonomyDetectResultDisplay'

const props = defineProps<{
  /** 单条指纹检测证据 */
  evidence: AutonomyFingerprintEvidenceItem
}>()

/** 告警类型 Tag 颜色 */
const alertTagColor = computed(
  () => AUTONOMY_FINGERPRINT_ALERT_TYPE_COLOR[props.evidence.alertType],
)

/** 告警类型展示文案 */
const alertLabel = computed(
  () => AUTONOMY_FINGERPRINT_ALERT_TYPE_LABEL[props.evidence.alertType],
)
</script>

<style scoped>
.fp-description {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: rgba(0, 0, 0, 0.65);
}
</style>
