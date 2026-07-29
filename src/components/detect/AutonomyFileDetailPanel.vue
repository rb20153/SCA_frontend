<template>
  <PageLoading :loading="loading">
    <a-empty v-if="!detail && !loading" description="暂无该文件详情" />

    <template v-else-if="detail">
      <div class="panel-head-row">
        <h3 class="panel-title">文件详情</h3>
        <span class="current-file-hint">
          当前文件：{{ detail.summary.fileName }}（{{ detail.summary.fileTypeLabel }}）
        </span>
      </div>

      <div class="desc-grid">
        <div class="desc-item">
          <span class="desc-label">问题行数</span>
          <DetailText :text="detail.summary.issueLineRanges" />
        </div>
        <div class="desc-item">
          <span class="desc-label">整体问题率</span>
          <span>{{ formatIssueRate(detail.summary.overallIssueRate) }}</span>
        </div>
        <div class="desc-item">
          <span class="desc-label">来源项目</span>
          <a
            v-if="detail.summary.sourceUrl"
            class="source-link"
            :href="detail.summary.sourceUrl"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ detail.summary.sourceProject }}
          </a>
          <DetailText v-else :text="detail.summary.sourceProject" />
        </div>
        <div class="desc-item">
          <span class="desc-label">来源版本</span>
          <DetailText :text="detail.summary.sourceVersion" />
        </div>
        <div class="desc-item">
          <span class="desc-label">最高置信度</span>
          <span>{{ formatConfidence(detail.summary.maxConfidence) }}</span>
        </div>
      </div>

      <AutonomyEvidenceSection
        title="代码检测证据"
        :count="detail.codeEvidences.length"
        :items="detail.codeEvidences"
        :items-per-page="1"
        :pagination-threshold="1"
        empty-description="暂无代码检测证据"
      >
        <template #item="{ item }">
          <AutonomyCodeEvidenceCard :evidence="item as AutonomyCodeEvidenceItem" />
        </template>
      </AutonomyEvidenceSection>

      <AutonomyEvidenceSection
        title="指纹检测证据"
        evidence-variant="fingerprint"
        :count="detail.fingerprintEvidences.length"
        :items="detail.fingerprintEvidences"
        :items-per-page="2"
        :pagination-threshold="2"
        empty-description="暂无指纹检测证据"
      >
        <template #item="{ item }">
          <AutonomyFingerprintEvidenceCard :evidence="item as AutonomyFingerprintEvidenceItem" />
        </template>
      </AutonomyEvidenceSection>
    </template>
  </PageLoading>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { getAutonomyDetectFileDetail } from '@/api/detect'
import DetailText from '@/components/common/DetailText.vue'
import PageLoading from '@/components/common/PageLoading.vue'
import AutonomyCodeEvidenceCard from '@/components/detect/AutonomyCodeEvidenceCard.vue'
import AutonomyEvidenceSection from '@/components/detect/AutonomyEvidenceSection.vue'
import AutonomyFingerprintEvidenceCard from '@/components/detect/AutonomyFingerprintEvidenceCard.vue'
import type { AutonomyCodeEvidenceItem, AutonomyFileDetail, AutonomyFingerprintEvidenceItem } from '@/types/detect'

const props = defineProps<{
  taskId: string
  /** 证据树选中的文件节点 ID */
  fileId: string | undefined
  /** 文件名，用于 mock 与展示 */
  fileName: string | undefined
}>()

const loading = ref(false)
const detail = ref<AutonomyFileDetail | null>(null)

/** 问题率百分比展示 */
function formatIssueRate(rate: number): string {
  return `${rate.toFixed(1)}%`
}

/** 置信度保留两位小数 */
function formatConfidence(value: number): string {
  return value.toFixed(2)
}

/** 选中文件变化时拉取详情 */
async function fetchDetail(fileId: string, fileName: string) {
  loading.value = true
  detail.value = null
  try {
    const res = await getAutonomyDetectFileDetail(props.taskId, fileId, fileName)
    detail.value = res.data
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.fileId, props.fileName] as const,
  ([fileId, fileName]) => {
    if (fileId && fileName) {
      fetchDetail(fileId, fileName)
    } else {
      detail.value = null
    }
  },
  { immediate: true },
)
</script>

<style scoped>
.panel-head-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 16px;
  margin-bottom: 16px;
}

.panel-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.88);
}

.current-file-hint {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.45);
}

.desc-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 16px;
}

.desc-label {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
}

.desc-item {
  min-width: 0;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.88);
}

.source-link {
  color: #1677ff;
  text-decoration: none;
}

.source-link:hover {
  text-decoration: underline;
}

@media (max-width: 992px) {
  .desc-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 576px) {
  .desc-grid {
    grid-template-columns: 1fr;
  }
}
</style>
