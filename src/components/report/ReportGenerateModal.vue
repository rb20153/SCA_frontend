<template>
  <a-modal
    v-model:open="visible"
    title="生成检测报告"
    :confirm-loading="submitting"
    :ok-button-props="{ disabled: optionsLoading }"
    ok-text="确定"
    cancel-text="取消"
    width="640px"
    destroy-on-close
    @ok="handleOk"
  >
    <a-spin :spinning="optionsLoading">
      <a-form layout="vertical" class="generate-form">
        <a-form-item label="项目" required>
          <a-select
            v-model:value="form.projectId"
            placeholder="请选择项目"
            show-search
            option-filter-prop="label"
            :list-height="256"
            :options="projectOptions"
            class="generate-select"
            @change="handleProjectChange"
          />
        </a-form-item>

        <a-form-item label="任务" required>
          <a-select
            v-model:value="form.taskId"
            placeholder="请选择任务"
            show-search
            option-filter-prop="label"
            :list-height="256"
            :options="taskOptions"
            :disabled="!form.projectId || tasksLoading"
            class="generate-select"
          />
        </a-form-item>

        <a-form-item label="模板" required>
          <a-select
            v-model:value="form.templateId"
            placeholder="请选择模板"
            show-search
            option-filter-prop="label"
            :list-height="256"
            :options="templateOptions"
            class="generate-select"
          />
        </a-form-item>

        <p class="template-hint">
          如需查看、新增、调整报告内容和变量位置，可进入
          <router-link to="/reports/templates" class="template-link" @click="handleTemplateLinkClick">
            报告模板
          </router-link>
          编辑。
        </p>
      </a-form>
    </a-spin>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { getTaskList } from '@/api/detect'
import { generateReport } from '@/api/report'
import { getReportTemplateList } from '@/api/reportTemplate'
import { getProjectList } from '@/api/project'
import type { DetectTask } from '@/types/detect'
import type { Project } from '@/types/project'
import type { ReportTemplate } from '@/types/reportTemplate'

const visible = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  success: []
}>()

const REPORT_SELECT_PAGE_SIZE = 100

const submitting = ref(false)
const optionsLoading = ref(false)
const tasksLoading = ref(false)

const projects = ref<Project[]>([])
const tasks = ref<DetectTask[]>([])
const templates = ref<ReportTemplate[]>([])

const form = reactive({
  projectId: '',
  taskId: '',
  templateId: '',
})

/** 项目下拉选项 */
const projectOptions = computed(() =>
  projects.value.map((item) => ({
    label: item.projectName,
    value: item.projectId,
  })),
)

/** 当前项目下的任务下拉选项 */
const taskOptions = computed(() =>
  tasks.value.map((item) => ({
    label: item.taskName,
    value: item.taskId,
  })),
)

/** 模板下拉选项 */
const templateOptions = computed(() =>
  templates.value.map((item) => ({
    label: item.templateName,
    value: item.templateId,
  })),
)

/** 拉取项目与模板选项，并初始化默认选中项 */
async function loadBaseOptions() {
  optionsLoading.value = true
  try {
    const [projectRes, templateRes] = await Promise.all([
      getProjectList({ page: 1, pageSize: REPORT_SELECT_PAGE_SIZE }),
      getReportTemplateList({ page: 1, pageSize: REPORT_SELECT_PAGE_SIZE }),
    ])

    projects.value = projectRes.data.list
    templates.value = templateRes.data.list.filter((item) => item.status === 'published')

    form.projectId = projects.value[0]?.projectId ?? ''

    const publishedTemplates = templates.value
    const defaultTemplate =
      publishedTemplates.find((item) => item.isDefault) ?? publishedTemplates[0]
    form.templateId = defaultTemplate?.templateId ?? ''

    if (form.projectId) {
      await loadTasksForProject(form.projectId)
    } else {
      tasks.value = []
      form.taskId = ''
    }
  } finally {
    optionsLoading.value = false
  }
}

/**
 * 按项目加载任务列表，默认选中最新任务
 * @param projectId - 项目 ID
 */
async function loadTasksForProject(projectId: string) {
  tasksLoading.value = true
  try {
    const res = await getTaskList({
      projectId,
      page: 1,
      pageSize: REPORT_SELECT_PAGE_SIZE,
    })
    tasks.value = res.data.list
    form.taskId = tasks.value[0]?.taskId ?? ''
  } finally {
    tasksLoading.value = false
  }
}

/** 切换项目后重新加载任务列表 */
async function handleProjectChange(value: unknown) {
  const projectId = String(value ?? '')
  if (!projectId) {
    tasks.value = []
    form.taskId = ''
    return
  }
  await loadTasksForProject(projectId)
}

/** 跳转报告模板页时关闭弹窗 */
function handleTemplateLinkClick() {
  visible.value = false
}

/** 校验并提交生成报告 */
async function handleOk() {
  if (!form.projectId) {
    message.warning('请选择项目')
    return
  }
  if (!form.taskId) {
    message.warning('请选择任务')
    return
  }
  if (!form.templateId) {
    message.warning('请选择模板')
    return
  }

  submitting.value = true
  try {
    await generateReport({
      projectId: form.projectId,
      taskId: form.taskId,
      templateId: form.templateId,
    })
    visible.value = false
    message.success('报告生成任务已提交')
    emit('success')
  } finally {
    submitting.value = false
  }
}

watch(
  () => visible.value,
  (open) => {
    if (open) {
      loadBaseOptions()
    }
  },
)
</script>

<style scoped>
.generate-form {
  margin-top: 8px;
}

.generate-select {
  width: 100%;
}

.template-hint {
  margin: 0;
  color: rgba(0, 0, 0, 0.45);
  font-size: 14px;
  line-height: 1.6;
}

.template-link {
  color: #1677ff;
}

.template-link:hover {
  color: #4096ff;
}
</style>
