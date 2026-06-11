<template>
  <span class="action-cell">
    <template v-for="action in actions" :key="action.key">
      <router-link
        v-if="action.key === 'viewResult'"
        :to="getTaskResultRoute(task)"
        class="list-table-link"
      >
        {{ action.label }}
      </router-link>
      <router-link
        v-else-if="action.key === 'viewLog'"
        :to="getTaskLogListRoute(task)"
        class="list-table-link"
      >
        {{ action.label }}
      </router-link>
      <a v-else href="#" class="list-table-link" @click.prevent="openModal(action.key)">
        {{ action.label }}
      </a>
    </template>
  </span>

  <!-- 编辑 -->
  <a-modal
    v-model:open="editVisible"
    title="编辑检测任务"
    :confirm-loading="submitting"
    ok-text="保存"
    cancel-text="取消"
    destroy-on-close
    @ok="submitEdit"
  >
    <a-form layout="vertical">
      <a-form-item label="任务名称" required>
        <a-input v-model:value="editForm.taskName" placeholder="请输入任务名称" />
      </a-form-item>
      <a-form-item label="扫描模式" required>
        <a-select v-model:value="editForm.sourceMode" :options="autonomySourceOptions" />
      </a-form-item>
      <a-form-item label="重试次数" required>
        <a-input-number
          v-model:value="editForm.retryCount"
          :min="0"
          :max="99"
          style="width: 100%"
        />
      </a-form-item>
    </a-form>
  </a-modal>

  <!-- 暂停 -->
  <a-modal
    v-model:open="pauseVisible"
    title="暂停任务"
    :confirm-loading="submitting"
    ok-text="确定"
    cancel-text="取消"
    ok-type="danger"
    @ok="submitPause"
  >
    <p>暂停后可恢复，已完成阶段结果将被保留。</p>
  </a-modal>

  <!-- 终止 -->
  <a-modal
    v-model:open="terminateVisible"
    title="终止任务"
    :confirm-loading="submitting"
    ok-text="确定"
    cancel-text="取消"
    destroy-on-close
    @ok="submitTerminate"
  >
    <a-form layout="vertical">
      <a-form-item label="终止原因" required>
        <a-textarea
          v-model:value="terminateReason"
          :rows="3"
          placeholder="请输入终止原因"
        />
      </a-form-item>
    </a-form>
  </a-modal>

  <!-- 继续 -->
  <a-modal
    v-model:open="resumeVisible"
    title="继续任务"
    :confirm-loading="submitting"
    ok-text="确定"
    cancel-text="取消"
    @ok="submitResume"
  >
    <p>确定继续运行该任务吗？</p>
  </a-modal>

  <!-- 删除 -->
  <a-modal
    v-model:open="deleteVisible"
    title="删除任务"
    :confirm-loading="submitting"
    ok-text="确定"
    cancel-text="取消"
    ok-type="danger"
    @ok="submitDelete"
  >
    <p>删除任务及中间结果。</p>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import type { AutonomySourceMode } from '@/types/common'
import type { DetectTask } from '@/types/detect'
import {
  deleteTask,
  pauseTask,
  resumeTask,
  terminateTask,
  updateDetectTask,
} from '@/api/detect'
import {
  TASK_SOURCE_MODE_LABEL,
  getTaskLogListRoute,
  getTaskResultRoute,
} from '@/utils/taskDisplay'
import { getTaskActions, type TaskActionKey } from '@/utils/taskActions'

const props = defineProps<{
  task: DetectTask
}>()

const emit = defineEmits<{
  'task-updated': [task: DetectTask]
  'task-deleted': [taskId: string]
}>()

const submitting = ref(false)
const editVisible = ref(false)
const pauseVisible = ref(false)
const terminateVisible = ref(false)
const resumeVisible = ref(false)
const deleteVisible = ref(false)
const terminateReason = ref('')

const editForm = reactive({
  taskName: '',
  sourceMode: 'full-scan' as AutonomySourceMode,
  retryCount: 3,
})

const actions = computed(() => getTaskActions(props.task))

const autonomySourceOptions = (
  ['full-scan', 'incremental-scan', 'quick-scan'] as AutonomySourceMode[]
).map((value) => ({
  value,
  label: TASK_SOURCE_MODE_LABEL[value],
}))

function openModal(key: TaskActionKey) {
  if (key === 'edit') {
    editForm.taskName = props.task.taskName
    editForm.sourceMode =
      props.task.taskType === 'autonomy'
        ? (props.task.sourceMode as AutonomySourceMode)
        : 'full-scan'
    editForm.retryCount = props.task.retryCount ?? 3
    editVisible.value = true
    return
  }
  if (key === 'pause') {
    pauseVisible.value = true
    return
  }
  if (key === 'terminate') {
    terminateReason.value = ''
    terminateVisible.value = true
    return
  }
  if (key === 'resume') {
    resumeVisible.value = true
    return
  }
  if (key === 'delete') {
    deleteVisible.value = true
  }
}

async function submitEdit() {
  if (!editForm.taskName.trim()) {
    message.warning('请输入任务名称')
    return Promise.reject()
  }
  submitting.value = true
  try {
    const res = await updateDetectTask(props.task.taskId, {
      taskName: editForm.taskName.trim(),
      sourceMode: editForm.sourceMode,
      retryCount: editForm.retryCount,
    })
    message.success('保存成功')
    editVisible.value = false
    emit('task-updated', res.data)
  } finally {
    submitting.value = false
  }
}

async function submitPause() {
  submitting.value = true
  try {
    const res = await pauseTask(props.task.taskId)
    message.success('已暂停')
    pauseVisible.value = false
    emit('task-updated', res.data)
  } finally {
    submitting.value = false
  }
}

async function submitTerminate() {
  if (!terminateReason.value.trim()) {
    message.warning('请输入终止原因')
    return Promise.reject()
  }
  submitting.value = true
  try {
    const res = await terminateTask(props.task.taskId, {
      reason: terminateReason.value.trim(),
    })
    message.success('已终止')
    terminateVisible.value = false
    emit('task-updated', res.data)
  } finally {
    submitting.value = false
  }
}

async function submitResume() {
  submitting.value = true
  try {
    const res = await resumeTask(props.task.taskId)
    message.success('任务已继续运行')
    resumeVisible.value = false
    emit('task-updated', res.data)
  } finally {
    submitting.value = false
  }
}

async function submitDelete() {
  submitting.value = true
  try {
    await deleteTask(props.task.taskId)
    message.success('删除成功')
    deleteVisible.value = false
    emit('task-deleted', props.task.taskId)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.action-cell {
  display: inline-flex;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: center;
  gap: 12px;
  white-space: nowrap;
}

</style>
