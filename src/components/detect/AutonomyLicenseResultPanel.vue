<template>
  <PageLoading :loading="loading && !result">
    <a-alert
      v-if="result"
      :type="provenanceAlertType"
      show-icon
      :message="provenanceLabel"
      :description="provenanceDescription"
      class="provenance-alert"
    />

    <a-alert v-if="error" type="error" show-icon message="许可证取证结果加载失败" class="provenance-alert">
      <template #description>
        <a-button size="small" @click="fetchResult">重新加载</a-button>
      </template>
    </a-alert>

    <a-empty v-if="!loading && !result && !error" description="暂无许可证取证结果" />

    <template v-else-if="result">
      <div class="license-summary-grid">
        <a-card size="small"><a-statistic title="项目声明来源" :value="displayCount(result.summary.projectDeclaredCount)" /></a-card>
        <a-card size="small"><a-statistic title="匹配来源许可证" :value="displayCount(result.summary.matchedSourceCount)" /></a-card>
        <a-card size="small"><a-statistic title="项目许可证种类" :value="result.summary.projectLicenseIds.length" /></a-card>
        <a-card size="small"><a-statistic title="来源许可证种类" :value="result.summary.sourceLicenseIds.length" /></a-card>
      </div>

      <section class="license-section">
        <h3>项目交付物声明</h3>
        <a-table
          v-if="result.projectDeclared.length"
          :columns="declaredColumns"
          :data-source="result.projectDeclared"
          :pagination="false"
          :scroll="{ x: 760 }"
          row-key="artifactId"
          size="small"
        />
        <a-empty v-else description="暂无项目自身许可证声明" />
      </section>

      <section class="license-section">
        <h3>相似来源库许可证</h3>
        <a-table
          v-if="result.matchedSources.length"
          :columns="matchedColumns"
          :data-source="result.matchedSources"
          :pagination="false"
          :scroll="{ x: 640 }"
          row-key="repoId"
          size="small"
        />
        <a-empty v-else description="暂无相似来源库许可证" />
      </section>

      <a-alert
        v-if="result.artifacts.some((item) => item.limitationReason || item.status !== 'completed')"
        type="warning"
        show-icon
        message="部分交付物许可证取证存在限制"
        class="provenance-alert"
      >
        <template #description>
          <ul class="limitation-list">
            <li v-for="item in limitedArtifacts" :key="item.artifactId || item.filePath">
              {{ item.filePath || '未知交付物' }}：{{ item.limitationReason || item.status || '状态未知' }}
            </li>
          </ul>
        </template>
      </a-alert>
    </template>
  </PageLoading>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { TableColumnsType } from 'ant-design-vue'
import { getAutonomyDetectLicenseResult } from '@/api/detect'
import type { AutonomyLicenseResult } from '@/types/detect'
import PageLoading from '@/components/common/PageLoading.vue'

const props = defineProps<{ taskId: string }>()
const loading = ref(false)
const result = ref<AutonomyLicenseResult | null>(null)
const error = ref(false)

const declaredColumns: TableColumnsType<AutonomyLicenseResult['projectDeclared'][number]> = [
  { title: '许可证', dataIndex: 'licenseId', key: 'licenseId', width: 150 },
  { title: '证据文件', dataIndex: 'filePath', key: 'filePath', ellipsis: true },
  { title: '交付物', dataIndex: 'artifactId', key: 'artifactId', width: 180, ellipsis: true },
  { title: '依赖层级', key: 'dependencyDepth', width: 110, customRender: ({ record }) => record.dependencyDepth == null ? '未知' : record.dependencyDepth },
]
const matchedColumns: TableColumnsType<AutonomyLicenseResult['matchedSources'][number]> = [
  { title: '许可证', dataIndex: 'licenseId', key: 'licenseId', width: 150 },
  { title: '来源库', dataIndex: 'repoId', key: 'repoId', ellipsis: true },
  { title: '来源文件', dataIndex: 'sourceFile', key: 'sourceFile', ellipsis: true },
  { title: '复核状态', dataIndex: 'reviewStatus', key: 'reviewStatus', width: 120 },
]

const provenanceLabel = computed(() => ({ completed: '许可证取证已完成', partial: '许可证取证部分完成', pending: '许可证取证处理中', unavailable: '暂无可用许可证取证', disabled: '许可证取证未启用', 'legacy-unavailable': '历史任务暂无许可证取证' } as Record<string, string>)[result.value?.provenanceStatus ?? ''] ?? '许可证取证状态未知')
const provenanceAlertType = computed(() => result.value?.provenanceStatus === 'completed' ? 'success' : result.value?.provenanceStatus === 'partial' ? 'warning' : 'info')
const provenanceDescription = computed(() => result.value?.licenseTextIsCopyEvidence === false ? '许可证文本仅作为许可证来源证据，不代表源码抄袭证据。' : '')
const limitedArtifacts = computed(() => result.value?.artifacts.filter((item) => item.limitationReason || item.status !== 'completed') ?? [])

function displayCount(value: number | null): string | number {
  return value == null ? '未知' : value
}

async function fetchResult() {
  loading.value = true
  error.value = false
  try {
    const response = await getAutonomyDetectLicenseResult(props.taskId)
    result.value = response.data
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

onMounted(fetchResult)
</script>

<style scoped>
.provenance-alert { margin-bottom: 16px; }
.license-summary-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 20px; }
.license-section { margin-top: 20px; }
.license-section h3 { margin: 0 0 12px; font-size: 16px; font-weight: 600; }
.limitation-list { margin: 0; padding-left: 18px; }
@media (max-width: 768px) { .license-summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
