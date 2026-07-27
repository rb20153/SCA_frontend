import type { CreateAiParseTaskParams, CreateDetectTaskParams } from '@/types/detect'
import type {
  CreateKbProjectParams,
  ImportOfflineVulnPackageParams,
  UploadKbVersionPackageParams,
} from '@/types/knowledge'
import type { PolicyImportParams } from '@/types/policy'
import type {
  AddProjectSourceDeliverableParams,
  UploadProjectBinaryDeliverableParams,
} from '@/types/project'
import type { SourceIngestFormState } from '@/types/sourceIngest'

/** 非空字符串才 append，避免 multipart 携带无意义空字段 */
function appendOptional(formData: FormData, key: string, value: string | undefined): void {
  if (value !== undefined && value !== '') {
    formData.append(key, value)
  }
}

/**
 * 将 SourceIngest 共用字段写入 FormData
 * @param formData - 目标 FormData
 * @param state - 仓库拉取 / 上传包表单状态
 */
export function appendSourceIngestFields(
  formData: FormData,
  state: SourceIngestFormState,
): void {
  formData.append('sourceMode', state.sourceMode)
  appendOptional(formData, 'repositoryUrl', state.repositoryUrl)
  formData.append('authType', state.authType)
  appendOptional(formData, 'accessToken', state.accessToken)
  appendOptional(formData, 'username', state.username)
  appendOptional(formData, 'password', state.password)
  appendOptional(formData, 'sshPrivateKey', state.sshPrivateKey)
  appendOptional(formData, 'sshPassphrase', state.sshPassphrase)
}

/**
 * 构建添加知识库开源项目 multipart 请求体
 * @param params - 项目名称、分类、入库方式与凭据或压缩包
 */
export function buildCreateKbProjectFormData(params: CreateKbProjectParams): FormData {
  const formData = new FormData()
  formData.append('projectName', params.projectName)
  formData.append('category', params.category)
  appendSourceIngestFields(formData, params)
  appendOptional(formData, 'packageVersion', params.packageVersion)
  if (params.tags?.length) {
    formData.append('tags', JSON.stringify(params.tags))
  }
  appendOptional(formData, 'remark', params.remark)
  if (params.packageFile) {
    formData.append('packageFile', params.packageFile)
  }
  return formData
}

/**
 * 构建知识库版本更新包上传 multipart 请求体
 * @param params - 更新包文件
 */
export function buildUploadKbVersionPackageFormData(
  params: UploadKbVersionPackageParams,
): FormData {
  const formData = new FormData()
  formData.append('file', params.file)
  return formData
}

/**
 * 构建漏洞离线包导入 multipart 请求体
 * @param params - 来源标签与漏洞包文件
 */
export function buildImportOfflineVulnPackageFormData(
  params: ImportOfflineVulnPackageParams,
): FormData {
  const formData = new FormData()
  formData.append('sourceTag', params.sourceTag)
  formData.append('file', params.file)
  return formData
}

/**
 * 构建策略文件导入 multipart 请求体
 * @param params - 文件、导入模式与校验项
 */
export function buildImportPolicyFormData(params: PolicyImportParams): FormData {
  const formData = new FormData()
  formData.append('file', params.file)
  formData.append('importMode', params.importMode)
  formData.append('prechecks', JSON.stringify(params.prechecks))
  appendOptional(formData, 'policyId', params.policyId)
  return formData
}

/**
 * 构建项目二进制交付物上传 multipart 请求体
 * @param params - 二进制文件
 */
export function buildUploadProjectBinaryDeliverableFormData(
  params: UploadProjectBinaryDeliverableParams,
): FormData {
  const formData = new FormData()
  formData.append('file', params.file)
  return formData
}

/**
 * 构建添加源码交付物 multipart 请求体
 * @param params - 来源方式、凭据或压缩包、扫描路径前缀
 */
export function buildAddProjectSourceDeliverableFormData(
  params: AddProjectSourceDeliverableParams,
): FormData {
  const formData = new FormData()
  appendSourceIngestFields(formData, params)
  appendOptional(formData, 'scanPathPrefix', params.scanPathPrefix)
  if (params.packageFile) {
    formData.append('packageFile', params.packageFile)
  }
  return formData
}

/**
 * 构建创建检测任务 multipart 请求体
 * 后端 `POST /api/detect/tasks` 统一收 multipart（import-sbom 需带文件），
 * 自主率任务无文件也走同一编码，避免两套请求体
 * @param params - 自主率或开源风险创建参数
 */
export function buildCreateDetectTaskFormData(params: CreateDetectTaskParams): FormData {
  const formData = new FormData()
  formData.append('taskType', params.taskType)
  formData.append('taskName', params.taskName.trim())
  formData.append('projectId', params.projectId)

  if (params.taskType === 'autonomy') {
    formData.append('scanMode', params.scanMode)
    formData.append('executionMode', params.executionMode)
    formData.append('workerCount', String(params.workerCount))
    formData.append('autoRetryEnabled', String(params.autoRetryEnabled))
    if (params.autoRetryEnabled && params.retryCount !== undefined) {
      formData.append('retryCount', String(params.retryCount))
    }
    return formData
  }

  formData.append('dataSource', params.dataSource)
  appendOptional(formData, 'scanScope', params.scanScope)
  appendOptional(formData, 'vulnDbVersion', params.vulnDbVersion)
  appendOptional(formData, 'dependencyDepth', params.dependencyDepth)
  if (params.sbomFile) {
    formData.append('sbomFile', params.sbomFile)
  }
  return formData
}

/**
 * 构建 AI 解析任务创建 multipart 请求体
 * @param params - 项目、来源与扫描深度
 */
export function buildCreateAiParseTaskFormData(params: CreateAiParseTaskParams): FormData {
  const formData = new FormData()
  formData.append('projectId', params.projectId)
  formData.append('scanDepth', String(params.scanDepth))
  appendSourceIngestFields(formData, {
    sourceMode: params.sourceMode,
    repositoryUrl: params.repositoryUrl ?? '',
    authType: params.authType ?? 'anonymous',
    accessToken: params.accessToken ?? '',
    username: params.username ?? '',
    password: params.password ?? '',
    sshPrivateKey: params.sshPrivateKey ?? '',
    sshPassphrase: params.sshPassphrase ?? '',
  })
  if (params.packageFile) {
    formData.append('packageFile', params.packageFile)
  }
  return formData
}
