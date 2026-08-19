/**
 * 新闻详情 —— 对齐 UI/UX §5 视图7 / PRD §6.3
 * 功能：标题/封面/发布日期/作者/来源 + 正文（富文本，后端已净化）+ 返回
 */
import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { fetchNewsItem } from '../api/client'
import { Loading, ProseHtml } from '../components/common'

/** 新闻详情主组件 */
export default function NewsDetail() {
  const [params] = useSearchParams()
  const id = params.get('id')
  const [news, setNews] = useState(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    setNews(null)
    setNotFound(false)
    fetchNewsItem(id).then(setNews).catch(() => setNotFound(true))
  }, [id])

  if (notFound) {
    return <main className="max-w-3xl mx-auto px-6 py-24 text-center text-muted">新闻不存在或未发布</main>
  }
  if (!news) return <Loading />

  const catLabel = news.category === 'company' ? '企业新闻' : '行业资讯'

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <Link to="/news" className="text-sm text-muted hover:text-brass">← 返回新闻列表</Link>

      <article className="mt-6">
        <h1 className="font-serif text-3xl text-ink leading-snug">{news.title}</h1>
        {/* 元信息：分类/日期/作者/来源 */}
        <div className="flex flex-wrap items-center gap-3 mt-4 text-xs text-muted border-b border-line pb-6">
          <span className="text-brass">{catLabel}</span>
          <span>发布日期：{news.publish_date}</span>
          {news.author && <span>作者：{news.author}</span>}
          {news.source && <span>来源：{news.source}</span>}
        </div>
        {/* 正文（prose-custom 排版，UI/UX §4.1） */}
        <div className="py-8">
          <ProseHtml html={news.content} />
        </div>
      </article>
    </main>
  )
}
