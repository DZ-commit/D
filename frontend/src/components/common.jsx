/**
 * 通用基础组件（前台）
 * 功能：区块标题、图片加载兜底（SVG 占位）、空态/加载态、富文本渲染
 * 说明：富文本内容后端已 bleach 白名单净化（ADR-004），此处仅做受控渲染
 */
import React, { useState } from 'react'

/** 区块标题：衬线大字 + 黄铜小标签，对齐 UI/UX §2.1 大留白风格 */
export function SectionTitle({ en, cn }) {
  return (
    <div className="text-center mb-12">
      {en && <p className="text-brass tracking-[0.3em] uppercase text-sm mb-2">{en}</p>}
      <h2 className="text-3xl md:text-4xl text-ink font-serif">{cn}</h2>
      <div className="w-16 h-px bg-brass mx-auto mt-4" aria-hidden="true" />
    </div>
  )
}

/** 图片组件：加载失败/无图时显示 SVG 占位（UI/UX §10 错误态） */
export function Img({ src, alt = '', className = '', ratio }) {
  const [failed, setFailed] = useState(false)
  // 无图或加载失败 → 展示品牌占位
  if (!src || failed) {
    return (
      <div
        className={`bg-line/60 flex items-center justify-center ${ratio || 'aspect-[4/3]'} ${className}`}
        role="img"
        aria-label={alt}
      >
        <svg viewBox="0 0 24 24" className="w-12 h-12 text-muted/50" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 5h18v14H3z" strokeLinejoin="round" />
          <circle cx="9" cy="10" r="1.5" />
          <path d="M3 17l6-5 4 3 8-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    )
  }
  return <img src={src} alt={alt} loading="lazy" className={className} onError={() => setFailed(true)} />
}

/** 空数据提示：优雅占位（PRD §6.1：空数据时不破坏布局） */
export function EmptyState({ text = '暂无内容' }) {
  return (
    <div className="py-20 text-center text-muted">
      <svg viewBox="0 0 24 24" className="w-12 h-12 mx-auto mb-3 text-line" fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M4 7h16M4 12h16M4 17h10" strokeLinecap="round" />
      </svg>
      <p>{text}</p>
    </div>
  )
}

/** 加载态：骨架占位（UI/UX §10） */
export function Loading() {
  return (
    <div className="py-20 text-center">
      <div className="inline-block w-8 h-8 border-2 border-brass border-t-transparent rounded-full animate-spin" />
      <p className="mt-3 text-muted text-sm">加载中...</p>
    </div>
  )
}

/** 富文本正文：内容已由后端 bleach 净化，受控渲染（prose-custom 排版，UI/UX §4.1） */
export function ProseHtml({ html, className = '' }) {
  if (!html) return null
  return (
    <div
      className={`prose-custom text-muted leading-[1.8] space-y-4 ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

/** 状态徽章：上架/发布等（前台列表角标） */
export function Badge({ children, className = '' }) {
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full bg-brass/10 text-brass-dark ${className}`}>
      {children}
    </span>
  )
}
