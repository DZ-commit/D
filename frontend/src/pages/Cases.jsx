/**
 * 新案例展示 —— 对齐 UI/UX §5 视图4 / PRD §6.2.2
 * 功能：案例卡片网格（封面/标题/简介）+ 分页；点击进详情
 */
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchCases } from '../api/client'
import { EmptyState, Img, Loading, SectionTitle } from '../components/common'

/** 案例卡片：图 + 标题 + 简介（line-clamp-2，UI/UX §4.3） */
function CaseCard({ c }) {
  return (
    <Link to={`/case-detail?id=${c.id}`} className="card-hover block bg-white rounded-xl border border-line overflow-hidden group">
      <Img src={c.cover_image} alt={c.title} className="w-full aspect-[16/10] object-cover group-hover:scale-105 transition-transform duration-500" />
      <div className="p-5">
        <h3 className="font-serif text-lg text-ink group-hover:text-brass transition-colors line-clamp-1">{c.title}</h3>
        {c.description && <p className="text-sm text-muted mt-1.5 line-clamp-2">{c.description}</p>}
      </div>
    </Link>
  )
}

/** 案例列表主组件 */
export default function Cases() {
  const [data, setData] = useState(null)
  const [page, setPage] = useState(1)
  const pageSize = 9

  useEffect(() => {
    setData(null)
    fetchCases({ page, pageSize })
      .then((r) => setData(r))
      .catch(() => setData({ items: [], total: 0, page, page_size: pageSize }))
  }, [page])

  const totalPages = data ? Math.max(1, Math.ceil(data.total / pageSize)) : 1

  return (
    <main className="max-w-7xl mx-auto px-6 py-16">
      <SectionTitle en="New Projects" cn="新案例展示" />
      {!data ? (
        <Loading />
      ) : data.items.length === 0 ? (
        <EmptyState text="案例准备中" />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.items.map((c) => (
              <CaseCard key={c.id} c={c} />
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
