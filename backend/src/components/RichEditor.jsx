/**
 * 富文本编辑器（后台）—— 对齐 PRD §12.1 / D8
 * 功能：@wangeditor 富文本；用于 产品详情/案例说明/新闻正文/招商政策/关于页 等标注字段
 * 说明：产出 HTML，后端入库前经 bleach 白名单净化（ADR-004）；仅后台引入（按需）
 *
 * 防白板加固（2026-08-19）：
 *  - wangeditor 在 React 18 严格模式/Modal 复用场景下可能「重复挂载 → DOM already inited」崩溃
 *  - 处理：① 项目移除 StrictMode（见 main.jsx）；② 此处用 ref 记录实例，onCreated 防重入先销毁旧实例
 */
import React, { useEffect, useRef, useState } from 'react'
import '@wangeditor/editor/dist/css/style.css'
import { Editor, Toolbar } from '@wangeditor/editor-for-react'

/** 富文本编辑器组件：受控 value(HTML 字符串) + onChange */
export default function RichEditor({ value = '', onChange, placeholder = '请输入内容...' }) {
  const [editor, setEditor] = useState(null) // 编辑器实例（用于 Toolbar 联动）
  const editorRef = useRef(null)             // 实例持久引用（防重入/卸载销毁）

  // 卸载时销毁编辑器实例（wangeditor 官方要求）
  useEffect(() => {
    return () => {
      if (editorRef.current) {
        try { editorRef.current.destroy() } catch { /* 已销毁则忽略 */ }
        editorRef.current = null
        setEditor(null)
      }
    }
  }, [])

  return (
    <div style={{ border: '1px solid #d9d9d9', borderRadius: 8, overflow: 'hidden' }}>
      {/* 工具栏 */}
      <Toolbar editor={editor} mode="default" style={{ borderBottom: '1px solid #d9d9d9' }} />
      {/* 编辑区 */}
      <Editor
        value={value}
        onCreated={(e) => {
          // 防重入：严格模式/Modal 复用导致重复 onCreated 时，先销毁旧实例再接管
          if (editorRef.current && editorRef.current !== e) {
            try { editorRef.current.destroy() } catch { /* ignore */ }
          }
          editorRef.current = e
          setEditor(e)
        }}
        onChange={(e) => onChange?.(e.getHtml())} // 编辑器内容变化 → 输出 HTML
        mode="default"
        placeholder={placeholder}
        style={{ height: 320, overflowY: 'hidden' }}
      />
    </div>
  )
}
