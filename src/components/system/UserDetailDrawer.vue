<template>
  <a-drawer
    v-model:open="visible"
    title="用户详情"
    placement="right"
    :width="560"
    destroy-on-close
    :footer-style="{ display: 'none' }"
  >
    <a-spin :spinning="loading">
      <template v-if="detail">
        <a-descriptions :column="1" bordered size="small" class="user-desc">
          <a-descriptions-item label="用户名">
            {{ detail.username }}
          </a-descriptions-item>
          <a-descriptions-item label="姓名">
            {{ detail.realName }}
          </a-descriptions-item>
          <a-descriptions-item label="部门">
            {{ detail.departmentName }}
          </a-descriptions-item>
          <a-descriptions-item label="系统角色">
            {{ detail.roleName }}
          </a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-tag :color="USER_STATUS_COLOR[detail.status]">
              {{ USER_STATUS_LABEL[detail.status] }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="最后登录时间">
            {{ formatLastLoginAt(detail.lastLoginAt) }}
          </a-descriptions-item>
        </a-descriptions>

        <div class="project-section">
          <div class="section-title">已加入项目</div>
          <div v-if="detail.joinedProjects.length > 0" class="project-tags">
            <a-tag
              v-for="project in detail.joinedProjects"
              :key="project.projectId"
              class="project-tag"
              @click="handleProjectClick(project.projectId)"
            >
              {{ project.projectName }}
            </a-tag>
          </div>
          <a-empty v-else description="暂无加入项目" />
        </div>

        <div class="project-section">
          <div class="section-title">负责项目</div>
          <div v-if="detail.ownedProjects.length > 0" class="project-tags">
            <a-tag
              v-for="project in detail.ownedProjects"
              :key="project.projectId"
              class="project-tag"
              @click="handleProjectClick(project.projectId)"
            >
              {{ project.projectName }}
            </a-tag>
          </div>
          <a-empty v-else description="暂无负责项目" />
        </div>
      </template>
    </a-spin>
  </a-drawer>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useRouteWithFrom } from '@/composables/useRouteWithFrom'
import { getUserDetail } from '@/api/user'
import type { UserDetail } from '@/types/user'
import {
  USER_STATUS_COLOR,
  USER_STATUS_LABEL,
  formatLastLoginAt,
} from '@/utils/userDisplay'

const props = defineProps<{
  /** 当前查看的用户 ID */
  userId: string
}>()

const visible = defineModel<boolean>('open', { required: true })

const router = useRouter()
const { withFrom } = useRouteWithFrom()
const loading = ref(false)
const detail = ref<UserDetail | null>(null)

/** 打开抽屉时拉取用户详情 */
async function loadDetail() {
  loading.value = true
  detail.value = null
  try {
    const res = await getUserDetail(props.userId)
    detail.value = res.data
  } finally {
    loading.value = false
  }
}

watch(
  () => [visible.value, props.userId] as const,
  ([open]) => {
    if (open) {
      loadDetail()
    } else {
      detail.value = null
    }
  },
  { immediate: true },
)

/** 点击项目 Tag 跳转项目详情 */
function handleProjectClick(projectId: string) {
  router.push(withFrom(`/projects/${projectId}`))
}
</script>

<style scoped>
.user-desc {
  margin-bottom: 24px;
}

.project-section {
  margin-bottom: 20px;
}

.section-title {
  margin-bottom: 8px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.88);
}

.project-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.project-tag {
  margin: 0;
  cursor: pointer;
}

.project-tag:hover {
  color: #1677ff;
  border-color: #1677ff;
}
</style>
