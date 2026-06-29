import { nextTick, onUnmounted, watch, type Ref } from 'vue'
import { json } from '@codemirror/lang-json'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { policyEditorTheme, policyJsonSyntaxHighlighting } from '@/utils/policyEditorCodeMirror'

/**
 * CodeMirror JSON 编辑器生命周期封装
 * - 容器就绪后初始化实例
 * - onUnmounted dispose，避免长时间运行内存泄漏
 * @param hostRef - 编辑器挂载容器
 * @param doc - 当前文档内容（双向同步用）
 * @param onDocChange - 用户编辑后回调
 */
export function usePolicyJsonEditor(
  hostRef: Ref<HTMLElement | null>,
  doc: Ref<string>,
  onDocChange: (value: string) => void,
) {
  let view: EditorView | null = null
  let applyingExternalDoc = false

  /** 销毁编辑器实例 */
  function destroyEditor() {
    view?.destroy()
    view = null
  }

  /** 将外部文档写入编辑器（加载接口数据时） */
  function setEditorDoc(next: string) {
    if (!view) {
      return
    }
    const current = view.state.doc.toString()
    if (current === next) {
      return
    }
    applyingExternalDoc = true
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: next },
    })
    applyingExternalDoc = false
  }

  /** 在容器 DOM 就绪后创建 CodeMirror 实例 */
  async function initEditor() {
    if (view || !hostRef.value) {
      return
    }
    await nextTick()
    if (!hostRef.value || view) {
      return
    }

    view = new EditorView({
      state: EditorState.create({
        doc: doc.value,
        extensions: [
          json(),
          history(),
          keymap.of([...defaultKeymap, ...historyKeymap]),
          policyEditorTheme,
          policyJsonSyntaxHighlighting,
          EditorView.lineWrapping,
          EditorView.updateListener.of((update) => {
            if (!update.docChanged || applyingExternalDoc) {
              return
            }
            onDocChange(update.state.doc.toString())
          }),
        ],
      }),
      parent: hostRef.value,
    })
  }

  watch(
    hostRef,
    (el) => {
      if (el) {
        void initEditor()
      }
    },
    { immediate: true, flush: 'post' },
  )

  onUnmounted(() => {
    destroyEditor()
  })

  watch(doc, (next) => {
    setEditorDoc(next)
  })

  return {
    setEditorDoc,
  }
}
