/**
 * 产品中心 —— 对齐 UI/UX §5 视图2 / PRD §6.2.1
 * 功能：按产品系列 + 空间分类（客厅/卧室/书房/茶室）筛选；卡片展示封面/名称/系列/空间标签；分页
 * 说明：series_id 支持从 URL 查询参数带入（首页系列卡跳转）
 */
import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { fetchProducts, fetchSeries } from '../api/client'
import { EmptyState, Img, Loading, SectionTitle } from '../components/common'
import Pagination from '../components/Pagination'

// 空间分类常量（应用层维护映射，预留分类表扩展，数据库设计文档 §7.2）
const CATEGORIES = [
  { id: 1, name: '客厅' },
  { id: 2, name: '卧室' },
  { id: 3, name: '书房' },
  { id: 4, name: '茶室' },
]

/** 筛选按钮：激活态黄铜高亮（UI/UX §4.1 .filter-active） */
function FilterBtn({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-5 py-2 rounded-full text-sm border transition-colors ${
        active ? 'bg-brass text-white border-brass' : 'border-line text-muted hover:border-brass hover:text-brass'
      }`}
    >
      {children}
    </button>
  )
}

/** 产品卡片：封面 + 名称 + 系列标签 + 空间标签（UI/UX §4.3） */
function ProductCard({ p }) {
  const cat = CATEGORIES.find((c) => c.id === p.category_id)
  return (
    <Link to={`/product-detail?id=${p.id}`} className="card-hover block bg-white rounded-xl border border-line overflow-hidden group">
      <Img src={p.cover_image} alt={p.name} className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-500" />
      <div className="p-5">
        <h3 className="font-serif text-lg text-ink group-hover:text-brass transition-colors line-clamp-1">{p.name}</h3>
        <div className="flex items-center gap-2 mt-2 text-xs">
          <span className="text-muted">{p.series_name || '—'}</span>
          {cat && <span className="text-brass border border-brass/40 rounded-full px-2 py-0.5">{cat.name}</span>}
        </div>
      </div>
    </Link>
  )
}

/** 产品中心主组件 */
export default function Products() {
  const [params] = useSearchParams()
  // 筛选状态：系列/空间分类/分页（series_id 支持 URL 传入）
  const [seriesList, setSeriesList] = useState([])
  const [seriesId, setSeriesId] = useState(Number(params.get('series_id')) || null)
  const [categoryId, setCategoryId] = useState(null)
  const [page, setPage] = useState(1)
  const [data, setData] = useState(null)

  const pageSize = 6

  // 加载系列筛选源
  useEffect(() => {
    fetchSeries().then((r) => setSeriesList(r.items || [])).catch(() => setSeriesList([]))
  }, [])

  // 筛选条件变化时重新拉取产品
  useEffect(() => {
    setData(null)
    fetchProducts({ page, pageSize, series_id: seriesId, category_id: categoryId })
      .then((r) => setData(r))
      .catch(() => setData({ items: [], total: 0, page, page_size: pageSize }))
  }, [seriesId, categoryId, page])

  /** 切换筛选：重置到第 1 页 */
  const select = (setter) => (v) => {
    setter(v)
    setPage(1)
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / pageSize)) : 1

  return (
    <main className="max-w-7xl mx-auto px-6 py-16">
      <SectionTitle en="Products" cn="产品中心" />

      {/* 系列 + 空间分类筛选：两行布局，「全部系列」「全部分类」作为行首按钮上下对齐 */}
      <div className="max-w-3xl mx-auto mb-10 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <FilterBtn active={seriesId === null} onClick={() => select(setSeriesId)(null)}>全部系列</FilterBtn>
          {seriesList.map((s) => (
            <FilterBtn key={s.id} active={seriesId === s.id} onClick={() => select(setSeriesId)(s.id)}>{s.name}</FilterBtn>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <FilterBtn active={categoryId === null} onClick={() => select(setCategoryId)(null)}>全部分类</FilterBtn>
          {CATEGORIES.map((c) => (
            <FilterBtn key={c.id} active={categoryId === c.id} onClick={() => select(setCategoryId)(c.id)}>{c.name}</FilterBtn>
          ))}
        </div>
      </div>

      {/* 产品网格（三列） */}
      {!data ? (
        <Loading />
      ) : data.items.length === 0 ? (
        <EmptyState text="该筛选条件下暂无产品" />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.items.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
          {/* 分页：数字页码 */}
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </main>
  )
}
