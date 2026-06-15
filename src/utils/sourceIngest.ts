import type { RepoAuthType, SourceIngestFormState, SourceIngestMode } from '@/types/sourceIngest'

export const SOURCE_INGEST_MODE_LABEL: Record<SourceIngestMode, string> = {
  'repo-pull': '从三方仓库拉取',
  'upload-source-package': '上传源码包',
}

export const REPO_AUTH_LABEL: Record<RepoAuthType, string> = {
  anonymous: '匿名访问',
  token: 'Git Token',
  basic: '用户名 / 密码',
  ssh: 'SSH Key',
}

/** 源码压缩包允许后缀 */
export const SOURCE_PACKAGE_EXTENSIONS = ['.zip', '.7z', '.tar.gz'] as const

const HTTPS_REPO_PLACEHOLDER = 'https://git.example.com/group/project.git'
const SSH_REPO_PLACEHOLDER = 'git@git.example.com:group/project.git'

/**
 * 按登录方式返回仓库地址 placeholder
 * @param authType - 登录方式
 */
export function getRepoUrlPlaceholder(authType: RepoAuthType): string {
  return authType === 'ssh' ? SSH_REPO_PLACEHOLDER : HTTPS_REPO_PLACEHOLDER
}

/** 创建默认源码入库表单 */
export function createDefaultSourceIngestForm(): SourceIngestFormState {
  return {
    sourceMode: 'repo-pull',
    repositoryUrl: '',
    authType: 'anonymous',
    accessToken: '',
    username: '',
    password: '',
    sshPrivateKey: '',
    sshPassphrase: '',
  }
}

/**
 * 校验源码入库表单（不含业务侧扩展字段如扫描路径前缀）
 * @param form - 表单状态
 * @param packageFile - 上传模式下的压缩包
 */
export function validateSourceIngestForm(
  form: SourceIngestFormState,
  packageFile?: File,
): { valid: true } | { valid: false; message: string } {
  if (form.sourceMode === 'upload-source-package') {
    if (!packageFile) {
      return { valid: false, message: '请上传源码压缩包' }
    }
    return { valid: true }
  }

  if (!form.repositoryUrl.trim()) {
    return { valid: false, message: '请输入仓库地址' }
  }

  if (form.authType === 'token' && !form.accessToken.trim()) {
    return { valid: false, message: '请输入 Access Token' }
  }

  if (form.authType === 'basic') {
    if (!form.username.trim()) {
      return { valid: false, message: '请输入用户名' }
    }
    if (!form.password.trim()) {
      return { valid: false, message: '请输入密码' }
    }
  }

  if (form.authType === 'ssh' && !form.sshPrivateKey.trim()) {
    return { valid: false, message: '请输入 SSH 私钥' }
  }

  return { valid: true }
}
