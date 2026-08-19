/**
 * 招聘列表 —— 对齐 UI/UX §5 视图8 / PRD §6.4
 * 功能：社会招聘/校园招聘切换；职位卡片（标题/部门/城市/发布日期）
 * 说明：type 支持 URL 参数（导航下拉传入 social/campus）
 */
import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { fetchJobs } from '../api/client'
import { EmptyState, Loading, SectionTitle } from '../components/common'

/** 职位卡片：标题 + 部门/城市 + 发布日期 + 投递按钮 */
function JobCard({ j }) {
  return (
    <div className="flex items-center justify-between gap-4 bg-white rounded-xl border border-line p-6 card-hover">
      <div>
        <h3 className="font-serif text-lg text-ink">{j.title}</h3>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-muted">
          {j.department && <span>部门：{j.department}</span>}
          {j.city && <span>城市：{j.city}</span>}
          {j.publish_date && <span>发布日期：{j.publish_date}</span>}
        </div>
      </div>
      <Link
        to={`/job-detail?id=${j.id}`}
        className="shrink-0 rounded-full bg-brass hover:bg-brass-dark text-white px-6 py-2 text-sm transition-colors"
      >
        查看职位
      </Link>
    </div>
  )
}

/** 招聘列表主组件 */
export default function Jobs() {
  const [params, setParams] = useSearchParams()
  // 分类：social/campus（URL 参数初始化）
  const [category, setCategory] = useState(params.get('type') || '')
  const [data, setData] = useState(null)
  const [page, setPage] = useState(1)
  const pageSize = 10

  const switchCategory = (cat) => {
    setCategory(cat)
    setPage(1)
    setParams(cat ? { type: cat } : {}, { replace: true })
  }

  useEffect(() => {
    setData(null)
    fetchJobs({ category: category || undefined, page, pageSize })
      .then((r) => setData(r))
      .catch(() => setData({ items: [], total: 0, page, page_size: pageSize }))
  }, [category, page])

  const totalPages = data ? Math.max(1, Math.ceil(data.total / pageSize)) : 1

  return (
    <main className="max-w-5xl mx-auto px-6 py-16">
      <SectionTitle en="Careers" cn="加入我们" />

      {/* 社会/校园切换 */}
      <div className="flex justify-center gap-4 mb-10">
        {[
          { key: '', label: '全部' },
          { key: 'social', label: '社会招聘' },
          { key: 'campus', label: '校园招聘' },
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
        <EmptyState text="暂无在招职位" />
      ) : (
        <>
          <div className="space-y-4">
            {data.items.map((j) => (
              <JobCard key={j.id} j={j} />
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
