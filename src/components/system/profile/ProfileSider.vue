<template>
  <aside class="profile-sider">
    <div class="profile-sider-head">
      <a-avatar :size="72" class="profile-avatar diffuse-gradient-avatar">
        {{ avatarText }}
      </a-avatar>
      <div class="profile-name">{{ profile.realName }}</div>
      <div class="profile-username">{{ profile.username }}</div>
    </div>

    <ul class="profile-nav">
      <li
        v-for="item in PROFILE_TAB_OPTIONS"
        :key="item.key"
        class="profile-nav-item"
        :class="{ active: activeTab === item.key }"
        @click="emit('update:activeTab', item.key)"
      >
        {{ item.label }}
      </li>
    </ul>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ProfileTab, UserProfile } from '@/types/profile'

const PROFILE_TAB_OPTIONS: Array<{ key: ProfileTab; label: string }> = [
  { key: 'basic', label: '基本设置' },
  { key: 'password', label: '修改密码' },
  { key: 'notify', label: '消息偏好' },
]

const props = defineProps<{
  profile: UserProfile
  activeTab: ProfileTab
}>()

const emit = defineEmits<{
  'update:activeTab': [tab: ProfileTab]
}>()

/** 头像展示用姓名首字 */
const avatarText = computed(() => props.profile.realName.charAt(0) || '用')
</script>

<style scoped>
.profile-sider {
  width: 220px;
  flex-shrink: 0;
  border-right: 1px solid #f0f0f0;
  padding: 24px 0 16px;
  background: #fafafa;
}

.profile-sider-head {
  text-align: center;
  padding: 0 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 8px;
}

.profile-avatar {
  margin: 0 auto 12px;
  font-size: 28px;
}

.profile-name {
  font-size: 16px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.88);
}

.profile-username {
  margin-top: 4px;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.45);
}

.profile-nav {
  list-style: none;
  margin: 0;
  padding: 8px 12px;
}

.profile-nav-item {
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  margin-bottom: 4px;
  transition: background 0.2s, color 0.2s;
}

.profile-nav-item:hover {
  background: #f0f0f0;
}

.profile-nav-item.active {
  background: #1677ff;
  color: #fff;
  font-weight: 500;
}
</style>
