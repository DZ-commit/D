/**
 * 富文本编辑器（后台）—— 对齐 PRD §12.1 / D8
 * 功能：@wangeditor 富文本；用于 产品详情/案例说明/新闻正文/招商政策/关于页 等标注字段
 * 说明：产出 HTML，后端入库前经 bleach 白名单净化（ADR-004）；仅后台引入（按需）
 */
import React, { useEffect, useState } from 'react'
import '@wangeditor/editor/dist/css/style.css'
import { Editor, Toolbar } from '@wangeditor/editor-for-react'

/** 富文本编辑器组件：受控 value(HTML 字符串) + onChange
 *  - 使用 `id` 作为 React key（受控于外部 stable id），避免 wangeditor 在
 *    Modal destroyOnClose + 严格模式 双重挂载时报「dom already inited」错
 */
export default function RichEditor({ value = '', onChange, placeholder = '请输入内容...' }) {
  const [editor, setEditor] = useState(null) // 编辑器实例（组件卸载时销毁）

  // 卸载时销毁编辑器实例（wangeditor 官方要求）
  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy()
        setEditor(null)
      }
    }
  }, [editor])

  return (
    <div style={{ border: '1px solid #d9d9d9', borderRadius: 8, overflow: 'hidden' }}>
      {/* 工具栏 */}
      <Toolbar editor={editor} mode="default" style={{ borderBottom: '1px solid #d9d9d9' }} />
      {/* 编辑区 */}
      <Editor
        value={value}
        onCreated={setEditor}
        onChange={(e) => onChange?.(e.getHtml())} // 编辑器内容变化 → 输出 HTML
        mode="default"
        placeholder={placeholder}
        style={{ height: 320, overflowY: 'hidden' }}
      />
    </div>
  )
}
