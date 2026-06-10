/**
 * 通过临时链接触发浏览器下载（mock 阶段占位链接）
 * @param url - 下载地址
 * @param fileName - 建议保存的文件名
 */
export function triggerReportDownload(url: string, fileName: string) {
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.rel = 'noopener'
  anchor.target = '_blank'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
}
