/**
 * 站内搜索 —— 对齐 UI/UX §5 视图16 / PRD §6.7
 * 功能：搜索产品（名称/系列）与新闻（标题/正文）；结果分类展示；空结果友好提示
 */
import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { fetchSearch } from '../api/client'
import { EmptyState, Img, Loading, SectionTitle } from '../components/common'

/** 搜索结果主组件 */
export default function Search() {
  const [params] = useSearchParams()
  const q = params.get('q') || ''
  const [result, setResult] = useState(null)

  // 关键字变化时重新搜索
  useEffect(() => {
    if (!q) {
      setResult({ products: [], news: [] })
      return
    }
    setResult(null)
    fetchSearch(q)
      .then((r) => setResult(r))
      .catch(() => setResult({ products: [], news: [] }))
  }, [q])

  const hasAny = result && (result.products.length > 0 || result.news.length > 0)

  return (
    <main className="max-w-5xl mx-auto px-6 py-16">
      <SectionTitle en="Search" cn={`搜索「${q}」的结果`} />

      {!result ? (
        <Loading />
      ) : !hasAny ? (
        <EmptyState text={`未找到与「${q}」相关的内容，换个关键词试试`} />
      ) : (
        <div className="space-y-12">
          {/* 产品结果 */}
          {result.products.length > 0 && (
            <section>
              <h2 className="font-serif text-2xl text-ink mb-6">产品（{result.products.length}）</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {result.products.map((p) => (
                  <Link key={p.id} to={`/product-detail?id=${p.id}`} className="card-hover block bg-white rounded-xl border border-line overflow-hidden group">
                    <Img src={p.cover_image} alt={p.name} className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="p-4">
                      <p className="font-serif text-ink group-hover:text-brass transition-colors">{p.name}</p>
                      <p className="text-xs text-muted mt-1">{p.series_name}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* 新闻结果 */}
          {result.news.length > 0 && (
            <section>
              <h2 className="font-serif text-2xl text-ink mb-6">新闻（{result.news.length}）</h2>
              <div className="space-y-3">
                {result.news.map((n) => (
                  <Link key={n.id} to={`/news-detail?id=${n.id}`} className="block bg-white rounded-xl border border-line p-5 card-hover group">
                    <p className="font-medium text-ink group-hover:text-brass transition-colors">{n.title}</p>
                    <p className="text-xs text-muted mt-1.5">{n.publish_date} · {n.category === 'company' ? '企业新闻' : '行业资讯'}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  )
}
