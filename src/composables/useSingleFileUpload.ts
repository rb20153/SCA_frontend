import { computed, ref } from 'vue'
import { message } from 'ant-design-vue'
import type { UploadFile } from 'ant-design-vue'
import type { RcFile } from 'ant-design-vue/es/vc-upload/interface'
import {
  createSingleUploadFileList,
  getUploadOriginFile,
  hasAllowedFileExtension,
} from '@/utils/fileUpload'

interface UseSingleFileUploadOptions {
  /** 允许的文件后缀 */
  allowedExtensions: readonly string[]
  /** 后缀不合法时的提示文案 */
  invalidExtensionMessage: string
}

/**
 * 单文件拖拽/点击上传状态封装（拦截自动上传、校验后缀）
 * @param options - 允许后缀与错误提示
 */
export function useSingleFileUpload(options: UseSingleFileUploadOptions) {
  const fileList = ref<UploadFile[]>([])

  /** 是否已选择并通过后缀校验的文件 */
  const hasValidFile = computed(() => getUploadOriginFile(fileList.value) !== undefined)

  /** 拦截自动上传，校验后缀后写入 fileList */
  function handleBeforeUpload(file: RcFile) {
    if (!hasAllowedFileExtension(file.name, options.allowedExtensions)) {
      message.error(options.invalidExtensionMessage)
      return false
    }

    fileList.value = createSingleUploadFileList(file)
    return false
  }

  /** 清空已选文件 */
  function clearFile() {
    fileList.value = []
  }

  /** 获取待提交的 File 对象 */
  function getSelectedFile(): File | undefined {
    return getUploadOriginFile(fileList.value)
  }

  return {
    fileList,
    hasValidFile,
    handleBeforeUpload,
    clearFile,
    getSelectedFile,
  }
}
