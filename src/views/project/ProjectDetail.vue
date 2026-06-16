<template>
  <div class="page-container">
    <PageLoading :loading="loading && !project">
      <a-empty v-if="!loading && !project" description="项目不存在或已删除" />
      <template v-else-if="project">
        <ProjectDetailSummary :project="project" />

        <PageNavTabs
          v-model:active-key="activeTab"
          :tabs="PROJECT_DETAIL_TABS"
        />

        <a-card :bordered="false" class="tab-content-card">
          <ProjectBasicInfoPanel
            v-show="activeTab === 'basic'"
            :project="project"
            @updated="onProjectBasicUpdated"
          />
          <ProjectDeliverablesPanel
            v-show="activeTab === 'deliverables'"
            :project="project"
            :visible="activeTab === 'deliverables'"
          />
          <ProjectPolicyPanel
            v-show="activeTab === 'policy'"
            :project-id="project.projectId"
            :visible="activeTab === 'policy'"
          />
          <ProjectMembersPanel
            v-show="activeTab === 'members'"
            :project="project"
            :visible="activeTab === 'members'"
            @owner-updated="onOwnerUpdated"
          />
          <ProjectRelatedTasksPanel
            v-show="activeTab === 'tasks'"
            :project="project"
            :visible="activeTab === 'tasks'"
          />
        </a-card>
      </template>
    </PageLoading>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getProjectDetail } from '@/api/project'
import PageLoading from '@/components/common/PageLoading.vue'
import PageNavTabs from '@/components/common/PageNavTabs.vue'
import ProjectBasicInfoPanel from '@/components/project/ProjectBasicInfoPanel.vue'
import ProjectDeliverablesPanel from '@/components/project/ProjectDeliverablesPanel.vue'
import ProjectDetailSummary from '@/components/project/ProjectDetailSummary.vue'
import ProjectMembersPanel from '@/components/project/ProjectMembersPanel.vue'
import ProjectPolicyPanel from '@/components/project/ProjectPolicyPanel.vue'
import ProjectRelatedTasksPanel from '@/components/project/ProjectRelatedTasksPanel.vue'
import type { Project, ProjectDetailTabKey } from '@/types/project'
import { PROJECT_DETAIL_TABS } from '@/utils/projectDisplay'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const project = ref<Project | null>(null)
const activeTab = ref<ProjectDetailTabKey>(resolveTabFromRoute())

/** 路由参数中的项目 ID */
const projectId = computed(() => String(route.params.projectId ?? ''))

/** 列表跳转时通过 history.state 携带的项目信息（刷新后失效） */
const navigationProject = computed<Project | undefined>(() => {
  const state = history.state as { project?: Project } | null
  if (state?.project?.projectId === projectId.value) {
    return state.project
  }
  return undefined
})

/** 从 URL query 解析当前 Tab */
function resolveTabFromRoute(): ProjectDetailTabKey {
  const tab = route.query.tab
  if (typeof tab === 'string' && PROJECT_DETAIL_TABS.some((item) => item.key === tab)) {
    return tab as ProjectDetailTabKey
  }
  return 'basic'
}

/** 将 Tab 状态同步到 URL，避免切换 Tab 时因重渲染丢失选中态 */
function syncTabToRoute(tab: ProjectDetailTabKey) {
  if (route.query.tab === tab || (tab === 'basic' && !route.query.tab)) {
    return
  }

  const query = { ...route.query }
  if (tab === 'basic') {
    delete query.tab
  } else {
    query.tab = tab
  }

  router.replace({ path: route.path, query })
}

/** 优先使用跳转携带的项目信息，否则请求详情 API；同项目刷新时不清空已有数据 */
async function loadProject() {
  const id = projectId.value
  if (!id) {
    project.value = null
    return
  }

  if (navigationProject.value) {
    project.value = navigationProject.value
    return
  }

  const keepVisible = project.value?.projectId === id
  if (!keepVisible) {
    project.value = null
  }

  loading.value = true
  try {
    const res = await getProjectDetail(id)
    project.value = res.data
  } catch {
    if (!keepVisible) {
      project.value = null
    }
  } finally {
    loading.value = false
  }
}

/** 基本信息更新后同步页面项目数据与顶部摘要 */
function onProjectBasicUpdated(updated: Project) {
  project.value = updated
}

/** 负责人变更后同步顶部摘要卡片（成员 Tab 移交负责人） */
function onOwnerUpdated(ownerName: string) {
  if (project.value) {
    project.value = { ...project.value, owner: ownerName }
  }
}

watch(
  () => route.query.tab,
  () => {
    const resolved = resolveTabFromRoute()
    if (activeTab.value !== resolved) {
      activeTab.value = resolved
    }
  },
)

watch(activeTab, (tab) => {
  syncTabToRoute(tab)
})

watch(projectId, (id, prevId) => {
  if (prevId && id !== prevId) {
    activeTab.value = 'basic'
    syncTabToRoute('basic')
  }
  loadProject()
}, { immediate: true })
</script>

<style scoped>
.page-container {
  min-height: 100%;
}

.tab-content-card {
  min-height: 240px;
}
</style>
