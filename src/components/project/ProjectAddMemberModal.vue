<template>
  <a-modal
    v-model:open="visible"
    title="添加成员"
    :confirm-loading="submitting"
    ok-text="确定"
    cancel-text="取消"
    :ok-button-props="{ disabled: !selectedUser }"
    destroy-on-close
    @ok="handleOk"
  >
    <a-form layout="vertical">
      <a-form-item label="选择用户" required>
        <a-input
          v-model:value="searchText"
          placeholder="请输入用户姓名"
          allow-clear
          autocomplete="off"
          @change="handleInputChange"
        />
        <div v-if="searchLoading" class="search-hint">搜索中...</div>
        <div v-else-if="showEmptyHint" class="search-hint search-hint--empty">
          没有找到该用户
        </div>
        <ul v-else-if="candidates.length > 0" class="candidate-list">
          <li
            v-for="user in candidates"
            :key="user.userId"
            class="candidate-item"
            :class="{ 'candidate-item--active': selectedUser?.userId === user.userId }"
            @click="selectCandidate(user)"
          >
            {{ user.realName }}
            <span class="candidate-meta">{{ user.departmentName }} · {{ user.roleName }}</span>
          </li>
        </ul>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { addProjectMember, searchProjectMemberCandidates } from '@/api/project'
import type { ProjectMemberCandidate } from '@/types/project'

const props = defineProps<{
  projectId: string
}>()

const visible = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  success: []
}>()

const submitting = ref(false)
const searchText = ref('')
const searchLoading = ref(false)
const showEmptyHint = ref(false)
const candidates = ref<ProjectMemberCandidate[]>([])
const selectedUser = ref<ProjectMemberCandidate | null>(null)

let searchTimer: ReturnType<typeof setTimeout> | null = null
let searchSeq = 0

/** 重置弹窗表单与搜索状态 */
function resetForm() {
  searchText.value = ''
  searchLoading.value = false
  showEmptyHint.value = false
  candidates.value = []
  selectedUser.value = null
  if (searchTimer !== null) {
    clearTimeout(searchTimer)
    searchTimer = null
  }
}

/** 输入变化时清除已选用户并防抖搜索 */
function handleInputChange() {
  selectedUser.value = null
  scheduleSearch(searchText.value)
}

/** 防抖触发用户搜索 */
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
  }, 300)
}

/** 请求可添加用户列表 */
async function fetchCandidates(keyword: string) {
  const seq = ++searchSeq
  searchLoading.value = true
  showEmptyHint.value = false
  candidates.value = []

  try {
    const res = await searchProjectMemberCandidates(props.projectId, keyword)
    if (seq !== searchSeq) {
      return
    }
    candidates.value = res.data
    showEmptyHint.value = res.data.length === 0
  } finally {
    if (seq === searchSeq) {
      searchLoading.value = false
    }
  }
}

/** 点击候选项填充输入框并记录选中用户 */
function selectCandidate(user: ProjectMemberCandidate) {
  selectedUser.value = user
  searchText.value = user.realName
  candidates.value = []
  showEmptyHint.value = false
}

/** 确认添加成员 */
async function handleOk() {
  if (!selectedUser.value) {
    message.warning('请从列表中选择用户')
    return Promise.reject()
  }

  submitting.value = true
  try {
    await addProjectMember(props.projectId, { userId: selectedUser.value.userId })
    message.success('添加成功')
    visible.value = false
    emit('success')
  } finally {
    submitting.value = false
  }
}

watch(
  () => visible.value,
  (open) => {
    if (!open) {
      resetForm()
    }
  },
)
</script>

<style scoped>
.search-hint {
  margin-top: 8px;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.45);
}

.search-hint--empty {
  color: rgba(0, 0, 0, 0.65);
}

.candidate-list {
  margin: 8px 0 0;
  padding: 0;
  list-style: none;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  max-height: 220px;
  overflow-y: auto;
}

.candidate-item {
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.candidate-item:hover,
.candidate-item--active {
  background: #e6f4ff;
}

.candidate-meta {
  margin-left: 8px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
}
</style>
