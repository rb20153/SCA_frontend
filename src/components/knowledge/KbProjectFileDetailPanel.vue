<template>
  <PageLoading :loading="loading">
    <a-empty v-if="!detail && !loading" description="暂无该文件详情" />

    <template v-else-if="detail">
      <div class="desc-grid">
        <div class="desc-item">
          <span class="desc-label">文件名</span>
          <DetailText :text="detail.fileName" />
        </div>
        <div class="desc-item">
          <span class="desc-label">文件类型</span>
          <DetailText :text="detail.fileType" />
        </div>
        <div class="desc-item">
          <span class="desc-label">大小</span>
          <span>{{ detail.sizeLabel }}</span>
        </div>
        <div class="desc-item">
          <span class="desc-label">指纹摘要</span>
          <DetailText :text="detail.fingerprintSummary" />
        </div>
        <div class="desc-item">
          <span class="desc-label">许可证线索</span>
          <DetailText :text="detail.licenseClue" />
        </div>

        <div class="desc-item desc-item--full">
          <span class="desc-label">路径</span>
          <DetailText :text="detail.path" />
        </div>
        <div class="desc-item desc-item--full">
          <span class="desc-label">MD5</span>
          <DetailText :text="detail.md5" />
        </div>
        <div class="desc-item desc-item--full">
          <span class="desc-label">SHA1</span>
          <DetailText :text="detail.sha1" />
        </div>
        <div class="desc-item desc-item--full">
          <span class="desc-label">来源候选</span>
          <DetailText :text="formatKbProjectSourceCandidates(detail.sourceCandidates)" />
        </div>
        <div class="desc-item desc-item--full">
          <span class="desc-label">最近更新时间</span>
          <DetailText :text="formatKbProjectFileUpdatedLine(detail.updatedAt, detail.writeContext)" />
        </div>
      </div>

      <h4 class="section-title">指纹与来源摘要</h4>
      <KbProjectFingerprintSummaryTable
        :key="fileNodeId"
        :data-source="detail.fingerprintSummaries"
        :loading="loading"
      />
    </template>
  </PageLoading>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { getKbProjectFileDetail } from '@/api/knowledge'
import DetailText from '@/components/common/DetailText.vue'
import PageLoading from '@/components/common/PageLoading.vue'
import KbProjectFingerprintSummaryTable from '@/components/knowledge/KbProjectFingerprintSummaryTable.vue'
import type { KbProjectFileDetail } from '@/types/knowledge'
import {
  formatKbProjectFileUpdatedLine,
  formatKbProjectSourceCandidates,
} from '@/utils/kbProjectDirectoryDisplay'

const props = defineProps<{
  kbProjectId: string
  versionId: string | undefined
  /** 目录树选中的文件节点 ID */
  fileNodeId: string | undefined
}>()

const loading = ref(false)
const detail = ref<KbProjectFileDetail | null>(null)

/** 选中文件变化时拉取详情 */
async function fetchDetail() {
  const { kbProjectId, versionId, fileNodeId } = props
  if (!kbProjectId || !versionId || !fileNodeId) {
    detail.value = null
    return
  }

  loading.value = true
  detail.value = null
  try {
    const res = await getKbProjectFileDetail({
      kbProjectId,
      versionId,
      fileNodeId,
    })
    detail.value = res.data
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.kbProjectId, props.versionId, props.fileNodeId] as const,
  () => {
    void fetchDetail()
  },
  { immediate: true },
)
</script>

<style scoped>
.desc-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 24px;
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

.desc-item--full {
  grid-column: 1 / -1;
}

.section-title {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.88);
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
