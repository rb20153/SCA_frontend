import axios from 'axios'
import { isApiSuccessCode } from '@/types/common'
import { getStoredToken } from '@/utils/tokenStorage'

/** 判断下载地址是否需要携带登录 Token（同源 /api 路径） */
function needsAuthenticatedFetch(url: string): boolean {
  if (url.startsWith('blob:')) {
    return false
  }
  try {
    const parsed = new URL(url, window.location.origin)
    return parsed.pathname.startsWith('/api/')
  } catch {
    return url.startsWith('/api/')
  }
}

/** 将相对或绝对 API 地址解析为可请求的完整 URL */
function resolveDownloadUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
    return url
  }
  const base = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''
  if (base) {
    return `${base}${url.startsWith('/') ? url : `/${url}`}`
  }
  return url.startsWith('/') ? url : `/${url}`
}

/**
 * 判断 JSON 文本是否为 API 错误包装（而非待下载的文件内容）
 * @returns 错误文案；null 表示可当作正常文件下载
 */
function parseDownloadErrorMessage(text: string): string | null {
  try {
    const body = JSON.parse(text) as Record<string, unknown>
    if (typeof body.code === 'number' && !isApiSuccessCode(body.code)) {
      return String(body.message ?? '下载失败')
    }
    if (body.success === false) {
      return String(body.message ?? '下载失败')
    }
    return null
  } catch {
    return null
  }
}

/**
 * 校验 blob 是否为 API 错误体；合法 JSON 文件（如 *.json 元数据）原样返回
 * @param blob - axios blob 响应
 */
async function normalizeDownloadBlob(blob: Blob): Promise<Blob> {
  const shouldInspect =
    blob.type.includes('json') ||
    blob.type.includes('text/plain') ||
    blob.size === 0 ||
    blob.size < 4096

  if (!shouldInspect) {
    return blob
  }

  const text = await blob.text()
  const errMsg = parseDownloadErrorMessage(text)
  if (errMsg) {
    throw new Error(errMsg)
  }

  if (!text.length) {
    throw new Error('下载文件为空，可能交付物已被删除或未上传成功')
  }

  return new Blob([text], { type: blob.type || 'application/octet-stream' })
}

/**
 * 携带 Bearer Token 拉取需鉴权的下载资源
 * @param url - 后端返回的 downloadUrl（通常为 /api/downloads/:token）
 */
async function fetchBlobWithAuth(url: string): Promise<Blob> {
  const resolvedUrl = resolveDownloadUrl(url)
  const token = getStoredToken()

  try {
    const res = await axios.get(resolvedUrl, {
      responseType: 'blob',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      timeout: 120_000,
    })
    return normalizeDownloadBlob(res.data as Blob)
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      throw new Error('登录已过期，请重新登录')
    }
    if (error instanceof Error) {
      throw error
    }
    throw new Error('下载失败')
  }
}

/** 通过临时链接触发浏览器保存文件 */
function triggerAnchorDownload(url: string, fileName: string): void {
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
}

/**
 * 将预览地址解析为 iframe 可直接加载的 URL
 * - 外链 / blob: / 签名临时链：原样返回
 * - 同源 /api/*：带 Bearer Token 拉 blob，再生成 objectURL（iframe 无法带 Authorization）
 * @param url - 后端返回的预览地址
 * @returns 可供 iframe src 使用的地址；调用方负责在不用时 revokeObjectURL
 */
export async function resolveAuthenticatedPreviewUrl(url: string): Promise<string> {
  if (!url) {
    throw new Error('预览地址无效')
  }
  if (!needsAuthenticatedFetch(url)) {
    return url
  }
  const blob = await fetchBlobWithAuth(url)
  return URL.createObjectURL(blob)
}

/**
 * 触发浏览器下载
 * - mock 的 blob: 或外链：直接 <a download>
 * - 同源 /api/*：先 axios 带 Token 拉 blob，再 objectURL 下载（避免 401）
 * @param url - 下载地址
 * @param fileName - 建议保存的文件名
 */
export async function triggerReportDownload(url: string, fileName: string): Promise<void> {
  if (!url) {
    throw new Error('下载地址无效')
  }

  if (!needsAuthenticatedFetch(url)) {
    triggerAnchorDownload(url, fileName)
    return
  }

  const blob = await fetchBlobWithAuth(url)
  const objectUrl = URL.createObjectURL(blob)
  triggerAnchorDownload(objectUrl, fileName)
  // 延迟释放，避免部分浏览器尚未开始保存就 revoke 导致下载失败
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
}
