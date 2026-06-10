<template>
  <a-config-provider :theme="theme">
    <a-layout class="admin-layout">
      <!-- ── Sidebar ──────────────────────────────────────────────── -->
      <a-layout-sider
        v-model:collapsed="layoutStore.sidebarCollapsed"
        :width="220"
        :collapsed-width="64"
        theme="dark"
        collapsible
        class="admin-sider"
      >
        <div class="logo" :class="{ 'logo--collapsed': layoutStore.sidebarCollapsed }">
          <span class="logo-text" v-if="!layoutStore.sidebarCollapsed">SCA 检测平台</span>
          <span class="logo-icon" v-else>SCA</span>
        </div>

        <a-menu
          v-model:selectedKeys="selectedKeys"
          v-model:openKeys="openKeys"
          theme="dark"
          mode="inline"
          @click="handleMenuClick"
        >
          <a-menu-item key="/dashboard">
            <template #icon><home-outlined /></template>
            <span>首页</span>
          </a-menu-item>

          <a-menu-item key="/projects">
            <template #icon><project-outlined /></template>
            <span>项目管理</span>
          </a-menu-item>

          <a-sub-menu key="detect">
            <template #icon><scan-outlined /></template>
            <template #title>检测分析</template>
            <a-menu-item key="/detect/tasks">检测任务</a-menu-item>
            <a-menu-item key="/detect/ai-analysis">AI辅助分析</a-menu-item>
          </a-sub-menu>

          <a-menu-item key="/policies">
            <template #icon><safety-outlined /></template>
            <span>策略管理</span>
          </a-menu-item>

          <a-menu-item key="/reports">
            <template #icon><file-text-outlined /></template>
            <span>报告管理</span>
          </a-menu-item>

          <a-sub-menu key="knowledge">
            <template #icon><database-outlined /></template>
            <template #title>知识库管理</template>
            <a-menu-item key="/knowledge">知识库管理</a-menu-item>
            <a-menu-item key="/knowledge/coverage">覆盖统计</a-menu-item>
            <a-menu-item key="/knowledge/vulnerabilities">漏洞知识库</a-menu-item>
          </a-sub-menu>

          <a-sub-menu key="system">
            <template #icon><setting-outlined /></template>
            <template #title>系统管理</template>
            <a-menu-item key="/system/users">用户列表</a-menu-item>
            <a-menu-item key="/system/roles">角色管理</a-menu-item>
            <a-menu-item key="/system/logs">日志列表</a-menu-item>
            <a-menu-item key="/system/alerts">告警中心</a-menu-item>
            <a-menu-item key="/system/messages">站内消息</a-menu-item>
          </a-sub-menu>
        </a-menu>
      </a-layout-sider>

      <!-- ── Main area ────────────────────────────────────────────── -->
      <a-layout class="admin-main">
        <!-- Header: fixed + full 100vw; sidebar (z-index 100) overlays the left overlap -->
        <a-layout-header class="admin-header">
          <a-breadcrumb class="header-breadcrumb">
            <a-breadcrumb-item v-for="(crumb, index) in layoutStore.breadcrumbs" :key="index">
              <router-link v-if="crumb.path" :to="crumb.path">{{ crumb.title }}</router-link>
              <span v-else>{{ crumb.title }}</span>
            </a-breadcrumb-item>
          </a-breadcrumb>

          <div class="header-right">
            <a-badge :count="unreadCount" :overflow-count="99">
              <router-link to="/system/messages" class="header-icon-btn">
                <bell-outlined />
              </router-link>
            </a-badge>

            <a-dropdown>
              <span class="header-user">
                <a-avatar size="small" :style="{ backgroundColor: '#1677ff' }">
                  {{ userInitial }}
                </a-avatar>
                <span class="header-username">{{ authStore.userInfo?.realName ?? '用户' }}</span>
              </span>
              <template #overlay>
                <a-menu>
                  <a-menu-item key="profile" @click="router.push('/system/profile')">
                    个人设置
                  </a-menu-item>
                  <a-menu-divider />
                  <a-menu-item key="logout" @click="handleLogout">退出登录</a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </div>
        </a-layout-header>

        <!-- Page content -->
        <a-layout-content class="admin-content">
          <PageLoading
            :loading="layoutStore.pageLoading"
            route-mode
            tip="页面加载中..."
          >
            <router-view />
          </PageLoading>
        </a-layout-content>
      </a-layout>
    </a-layout>
  </a-config-provider>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  HomeOutlined, ProjectOutlined, ScanOutlined, SafetyOutlined,
  FileTextOutlined, DatabaseOutlined, SettingOutlined, BellOutlined,
} from '@ant-design/icons-vue'
import PageLoading from '@/components/common/PageLoading.vue'
import { useAuthStore } from '@/stores/auth'
import { useLayoutStore } from '@/stores/layout'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const layoutStore = useLayoutStore()

const selectedKeys = ref<string[]>([])
const openKeys = ref<string[]>([])
const unreadCount = ref(0)

const userInitial = computed(() =>
  authStore.userInfo?.realName?.charAt(0) ?? '用'
)

// Dynamic sider width for responsive content margin
const siderWidth = computed(() => layoutStore.sidebarCollapsed ? 64 : 220)

const theme = {
  token: {
    colorPrimary: '#1677ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    borderRadius: 6,
  },
}

watch(
  () => route.path,
  (path) => {
    selectedKeys.value = [path]
    if (path.startsWith('/detect')) openKeys.value = ['detect']
    else if (path.startsWith('/knowledge')) openKeys.value = ['knowledge']
    else if (path.startsWith('/system')) openKeys.value = ['system']
    else openKeys.value = []
  },
  { immediate: true },
)

function handleMenuClick({ key }: { key: string }) {
  router.push(key)
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
}

/* Sidebar: fixed, z-index 100 — sits above the header's overlapping left portion */
.admin-sider {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 100;
  overflow-y: auto;
  overflow-x: hidden;
}

.logo {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
}

.logo-icon {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
}

/* Content area shifts right according to sider width (reactive via v-bind) */
.admin-main {
  margin-left: v-bind('siderWidth + "px"');
  transition: margin-left 0.2s;
  min-height: 100vh;
  /* Reserve space for the fixed header */
  padding-top: 56px;
}

/* Header: full-viewport-width, fixed, z-index 99 < sidebar's 100 */
.admin-header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  z-index: 99;
  background: #fff;
  padding: 0 24px;
  height: 56px;
  line-height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #f0f0f0;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.header-breadcrumb {
  flex: 1;
  /* Push breadcrumb text start to just past the sidebar; sidebar will visually cover the gap */
  padding-left: v-bind('siderWidth + "px"');
  transition: padding-left 0.2s;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-icon-btn {
  color: rgba(0, 0, 0, 0.65);
  font-size: 18px;
  display: flex;
  align-items: center;
}

.header-user {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: rgba(0, 0, 0, 0.88);
}

.header-username {
  font-size: 14px;
}

.admin-content {
  margin: 24px;
  min-height: calc(100vh - 56px - 48px);
}
</style>
