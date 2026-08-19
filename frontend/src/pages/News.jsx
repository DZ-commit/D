/**
 * 新闻列表 —— 对齐 UI/UX §5 视图6 / PRD §6.3
 * 功能：企业新闻/行业资讯分类切换（Tab）；时间倒序 + 置顶优先；分页
 * 说明：category 支持 URL 参数（导航下拉传入）；后端已过滤未发布/过期新闻
 */
import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { fetchNews } from '../api/client'
import { EmptyState, Img, Loading, SectionTitle } from '../components/common'

/** 新闻列表项：封面 + 分类/日期 + 标题 + 摘要（UI/UX §4.3） */
function NewsCard({ n }) {
  const catLabel = n.category === 'company' ? '企业新闻' : '行业资讯'
  return (
    <Link to={`/news-detail?id=${n.id}`} className="flex gap-5 bg-white rounded-xl border border-line p-4 card-hover group">
      <Img src={n.cover_image} alt={n.title} className="w-36 h-24 object-cover rounded-lg shrink-0" />
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-xs mb-1.5">
          <span className="text-brass">{catLabel}</span>
          <span className="text-muted">{n.publish_date}</span>
        </div>
        <h3 className="font-serif text-lg text-ink group-hover:text-brass transition-colors line-clamp-1">{n.title}</h3>
        {n.summary && <p className="text-sm text-muted mt-1 line-clamp-2">{n.summary}</p>}
      </div>
    </Link>
  )
}

/** 新闻列表主组件 */
export default function News() {
  const [params, setParams] = useSearchParams()
  // 分类：company/industry（从 URL 参数初始化）
  const [category, setCategory] = useState(params.get('category') || '')
  const [data, setData] = useState(null)
  const [page, setPage] = useState(1)
  const pageSize = 10

  // 切换分类（更新 URL 参数，保持可分享/返回）
  const switchCategory = (cat) => {
    setCategory(cat)
    setPage(1)
    setParams(cat ? { category: cat } : {}, { replace: true })
  }

  useEffect(() => {
    setData(null)
    fetchNews({ category: category || undefined, page, pageSize })
      .then((r) => setData(r))
      .catch(() => setData({ items: [], total: 0, page, page_size: pageSize }))
  }, [category, page])

  const totalPages = data ? Math.max(1, Math.ceil(data.total / pageSize)) : 1

  return (
    <main className="max-w-5xl mx-auto px-6 py-16">
      <SectionTitle en="News" cn="新闻动态" />

      {/* 分类 Tab（UI/UX §4.1 .tab-active） */}
      <div className="flex justify-center gap-4 mb-10">
        {[
          { key: '', label: '全部' },
          { key: 'company', label: '企业新闻' },
          { key: 'industry', label: '行业资讯' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => switchCategory(t.key)}
            className={`px-6 py-2 rounded-full text-sm border transition-colors ${
              category === t.key ? 'bg-brass text-white border-brass' : 'border-line text-muted hover:border-brass hover:text-brass'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!data ? (
        <Loading />
      ) : data.items.length === 0 ? (
        <EmptyState text="暂无相关新闻" />
      ) : (
        <>
          <div className="space-y-4">
            {data.items.map((n) => (
              <NewsCard key={n.id} n={n} />
            ))}
          </div>
          {/* 分页 */}
          <div className="flex justify-center gap-3 mt-12">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2 rounded-full border border-line text-sm disabled:opacity-40 hover:border-brass transition-colors"
            >
              ← 上一页
            </button>
            <span className="px-4 py-2 text-sm text-muted self-center">第 {page} / {totalPages} 页</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 rounded-full border border-line text-sm disabled:opacity-40 hover:border-brass transition-colors"
            >
              下一页 →
            </button>
          </div>
        </>
      )}
    </main>
  )
}
