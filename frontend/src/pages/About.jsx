/**
 * 关于D（公司总览）—— 对齐 UI/UX §5 视图12 / PRD §6.6
 * 功能：品牌/公司介绍长文 + 配图（后台 content_pages key=about_d）
 */
import React, { useEffect, useState } from 'react'
import { fetchAbout } from '../api/client'
import { Img, Loading, ProseHtml } from '../components/common'

/** 关于D主组件 */
export default function About() {
  const [page, setPage] = useState(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetchAbout('about_d').then(setPage).catch(() => setNotFound(true))
  }, [])

  if (notFound) {
    return <main className="max-w-4xl mx-auto px-6 py-24 text-center text-muted">内容准备中</main>
  }
  if (!page) return <Loading />

  return (
    <main className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="font-serif text-4xl text-ink text-center mb-12">{page.title || '关于D'}</h1>

      {/* 图集（可选） */}
      {page.images && page.images.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-10">
          {page.images.map((img, i) => (
            <Img key={i} src={img} alt="" className="w-full aspect-[16/10] rounded-xl object-cover" />
          ))}
        </div>
      )}

      {/* 公司介绍长文（富文本） */}
      <div className="bg-white rounded-xl border border-line p-8 md:p-12">
        <ProseHtml html={typeof page.content === 'string' ? page.content : ''} />
      </div>
    </main>
  )
}
