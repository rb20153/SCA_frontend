<template>
  <div class="page-container">
    <a-card :bordered="false" class="profile-card">
      <PageLoading :loading="loading">
        <a-empty v-if="!loading && !profile" description="加载个人资料失败" />
        <div v-else-if="profile" class="profile-layout">
          <ProfileSider v-model:active-tab="activeTab" :profile="profile" />

          <div class="profile-main">
            <ProfileBasicPanel
              v-if="activeTab === 'basic'"
              :profile="profile"
              @updated="onProfileUpdated"
              @cancel="onBasicCancel"
            />
            <ProfilePasswordPanel
              v-else-if="activeTab === 'password'"
              :key="passwordPanelKey"
            />
            <ProfileNotifyPanel
              v-else
              :preferences="notifyPreferences"
              @updated="onNotifyUpdated"
            />
          </div>
        </div>
      </PageLoading>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getUserProfile } from '@/api/profile'
import PageLoading from '@/components/common/PageLoading.vue'
import ProfileBasicPanel from '@/components/system/profile/ProfileBasicPanel.vue'
import ProfileNotifyPanel from '@/components/system/profile/ProfileNotifyPanel.vue'
import ProfilePasswordPanel from '@/components/system/profile/ProfilePasswordPanel.vue'
import ProfileSider from '@/components/system/profile/ProfileSider.vue'
import { useAuthStore } from '@/stores/auth'
import type { MessageNotifyPreferences, ProfileTab, UserProfile } from '@/types/profile'
import { createDefaultNotifyPreferences } from '@/utils/profileDisplay'

const route = useRoute()
const authStore = useAuthStore()

const loading = ref(false)
const activeTab = ref<ProfileTab>('basic')
const profile = ref<UserProfile | null>(null)
const notifyPreferences = ref<MessageNotifyPreferences>(createDefaultNotifyPreferences())
/** 每次进入改密 Tab 递增，强制重建表单避免浏览器自动填充旧密码 */
const passwordPanelKey = ref(0)

/** 从路由 query 解析初始 Tab（如站内消息「去修改密码」） */
function resolveTabFromRoute(): ProfileTab {
  const tab = route.query.tab
  if (tab === 'password' || tab === 'notify' || tab === 'basic') {
    return tab
  }
  return 'basic'
}

/** 拉取个人设置详情 */
async function loadProfile() {
  loading.value = true
  try {
    const res = await getUserProfile()
    profile.value = res.data.profile
    notifyPreferences.value = res.data.notifyPreferences
  } finally {
    loading.value = false
  }
}

/** 基本资料更新后同步页面与顶栏登录态 */
function onProfileUpdated(updated: UserProfile) {
  profile.value = updated
  if (authStore.userInfo) {
    authStore.setUserInfo({
      ...authStore.userInfo,
      realName: updated.realName,
      phone: updated.phone,
      department: updated.departmentName,
    })
  }
}

/** 取消修改时重新拉取服务端数据，确保与保存前一致 */
async function onBasicCancel() {
  await loadProfile()
}

/** 消息偏好保存后更新本地状态 */
function onNotifyUpdated(preferences: MessageNotifyPreferences) {
  notifyPreferences.value = preferences
}

watch(
  () => route.query.tab,
  () => {
    activeTab.value = resolveTabFromRoute()
  },
)

watch(activeTab, (tab) => {
  if (tab === 'password') {
    passwordPanelKey.value += 1
  }
})

onMounted(() => {
  activeTab.value = resolveTabFromRoute()
  loadProfile()
})
</script>

<style scoped>
.page-container {
  min-height: 100%;
}

.profile-card {
  overflow: hidden;
}

.profile-card :deep(.ant-card-body) {
  padding: 0;
}

.profile-layout {
  display: flex;
  min-height: 520px;
}

.profile-main {
  flex: 1;
  padding: 32px 40px 40px;
  background: #fff;
}
</style>
