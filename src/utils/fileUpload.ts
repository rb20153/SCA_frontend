import type { UploadFile } from 'ant-design-vue'
import type { RcFile } from 'ant-design-vue/es/vc-upload/interface'

/**
 * 校验文件名是否以允许的后缀结尾（大小写不敏感）
 * @param fileName - 原始文件名
 * @param extensions - 允许的后缀列表，如 ['.dll', '.so']
 */
export function hasAllowedFileExtension(fileName: string, extensions: readonly string[]): boolean {
  const lowerName = fileName.toLowerCase()
  return extensions.some((ext) => lowerName.endsWith(ext.toLowerCase()))
}

/**
 * 将 RcFile 转为单文件 UploadFile 列表（拦截自动上传时使用）
 * @param file - ant-design-vue 上传组件返回的文件
 */
export function createSingleUploadFileList(file: RcFile): UploadFile[] {
  return [
    {
      uid: file.uid,
      name: file.name,
      status: 'done',
      originFileObj: file,
    },
  ]
}

/**
 * 从 UploadFile 列表取首个 File 对象
 * @param fileList - a-upload 绑定的 fileList
 */
export function getUploadOriginFile(fileList: UploadFile[]): File | undefined {
  const file = fileList[0]?.originFileObj
  return file instanceof File ? file : undefined
}

/**
 * 将允许的后缀列表转为 input accept 属性值
 * @param extensions - 如 ['.a', '.so', '.dll']
 */
export function toAcceptAttribute(extensions: readonly string[]): string {
  return extensions.join(',')
}
