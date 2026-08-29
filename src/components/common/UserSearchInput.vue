<template>
  <div class="user-search-input">
    <a-input
      v-model:value="inputText"
      :placeholder="placeholder"
      :disabled="disabled"
      allow-clear
      autocomplete="off"
      @change="handleInputChange"
    />
    <div v-if="!disabled && searchLoading" class="user-search-hint">搜索中...</div>
    <div v-else-if="!disabled && showEmptyHint" class="user-search-hint user-search-hint--empty">
      {{ emptyHint }}
    </div>
    <ul v-else-if="!disabled && candidates.length > 0" class="user-search-list">
      <li
        v-for="user in candidates"
        :key="user.userId"
        class="user-search-item"
        :class="{ 'user-search-item--active': model?.userId === user.userId }"
        @click="selectCandidate(user)"
      >
        {{ user.realName }}
        <span class="user-search-meta">{{ user.departmentName }} · {{ user.roleName }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { UserSearchCandidate } from '@/types/user'

const props = withDefaults(
  defineProps<{
    /** 防抖搜索回调，由调用方决定过滤规则（如是否排除项目成员） */
    searchUsers: (keyword: string) => Promise<UserSearchCandidate[]>
    placeholder?: string
    emptyHint?: string
    /** 防抖毫秒数 */
    debounceMs?: number
    disabled?: boolean
  }>(),
  {
    placeholder: '请输入用户姓名',
    emptyHint: '没有找到该用户',
    debounceMs: 300,
    disabled: false,
  },
)

const model = defineModel<UserSearchCandidate | null>({ required: true })

const inputText = ref('')
const searchLoading = ref(false)
const showEmptyHint = ref(false)
const candidates = ref<UserSearchCandidate[]>([])

let searchTimer: ReturnType<typeof setTimeout> | null = null
let searchSeq = 0

/** 重置输入与搜索状态 */
function reset() {
  inputText.value = ''
  searchLoading.value = false
  showEmptyHint.value = false
  candidates.value = []
  model.value = null
  if (searchTimer !== null) {
    clearTimeout(searchTimer)
    searchTimer = null
  }
}

/** 外部设置展示姓名（编辑回填） */
function setDisplayName(name: string) {
  inputText.value = name
  model.value = null
  candidates.value = []
  showEmptyHint.value = false
}

/** 输入变化时清除已选并防抖搜索 */
function handleInputChange() {
  if (props.disabled) return
  model.value = null
  scheduleSearch(inputText.value)
}

/** 防抖触发搜索 */
function scheduleSearch(keyword: string) {
  if (searchTimer !== null) {
    clearTimeout(searchTimer)
  }

  const trimmed = keyword.trim()
  if (!trimmed) {
    searchLoading.value = false
    showEmptyHint.value = false
    candidates.value = []
    return
  }

  searchLoading.value = true
  showEmptyHint.value = false
  candidates.value = []

  searchTimer = setTimeout(() => {
    void fetchCandidates(trimmed)
  }, props.debounceMs)
}

/** 请求用户候选项 */
async function fetchCandidates(keyword: string) {
  const seq = ++searchSeq
  searchLoading.value = true
  showEmptyHint.value = false
  candidates.value = []

  try {
    const list = await props.searchUsers(keyword)
    if (seq !== searchSeq) {
      return
    }
    candidates.value = list
    showEmptyHint.value = list.length === 0
  } finally {
    if (seq === searchSeq) {
      searchLoading.value = false
    }
  }
}

/** 选中候选项 */
function selectCandidate(user: UserSearchCandidate) {
  if (props.disabled) return
  model.value = user
  inputText.value = user.realName
  candidates.value = []
  showEmptyHint.value = false
}

/** 提交用展示名：已选用户姓名，或未选时输入框文本 */
function getSubmitDisplayName(): string {
  return model.value?.realName ?? inputText.value.trim()
}

/** 是否已从列表选中用户 */
function hasSelectedUser(): boolean {
  return model.value !== null
}

watch(
  () => model.value,
  (user) => {
    if (user) {
      inputText.value = user.realName
    }
  },
)

defineExpose({
  reset,
  setDisplayName,
  getSubmitDisplayName,
  hasSelectedUser,
})
</script>

<style scoped>
.user-search-hint {
  margin-top: 8px;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.45);
}

.user-search-hint--empty {
  color: rgba(0, 0, 0, 0.65);
}

.user-search-list {
  margin: 8px 0 0;
  padding: 0;
  list-style: none;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  max-height: 220px;
  overflow-y: auto;
}

.user-search-item {
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.user-search-item:hover,
.user-search-item--active {
  background: #e6f4ff;
}

.user-search-meta {
  margin-left: 8px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
}
</style>
