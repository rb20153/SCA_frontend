/** 源码入库来源：三方仓库拉取 / 上传压缩包 */
export type SourceIngestMode = 'repo-pull' | 'upload-source-package'

/** 三方仓库登录方式 */
export type RepoAuthType = 'anonymous' | 'token' | 'basic' | 'ssh'

/** 仓库拉取 + 上传源码包共用表单（知识库添加开源项目、项目添加源码交付物） */
export interface SourceIngestFormState {
  sourceMode: SourceIngestMode
  /** 仓库 HTTPS 或 SSH 克隆地址 */
  repositoryUrl: string
  authType: RepoAuthType
  accessToken: string
  username: string
  password: string
  sshPrivateKey: string
  /** SSH 私钥口令，可选 */
  sshPassphrase: string
}
