/**
 * 案例详情 —— 对齐 UI/UX §5 视图5 / PRD §6.2.2
 * 功能：大图 + 图集、案例说明（富文本）、关联产品入口（可选，related_products）
 */
import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { fetchCase, fetchProduct } from '../api/client'
import { Img, Loading, ProseHtml } from '../components/common'

/** 案例详情主组件 */
export default function CaseDetail() {
  const [params] = useSearchParams()
  const id = params.get('id')
  const [detail, setDetail] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [imgIdx, setImgIdx] = useState(0)
  const [related, setRelated] = useState([])

  // 加载案例详情 + 关联产品信息（related_products 为产品 id 列表）
  useEffect(() => {
    if (!id) return
    setDetail(null)
    setNotFound(false)
    fetchCase(id)
      .then(async (d) => {
        setDetail(d)
        // 拉取关联产品简要信息（逐个请求，数量少可接受）
        const ids = d.related_products || []
        const list = await Promise.all(ids.map((pid) => fetchProduct(pid).catch(() => null)))
        setRelated(list.filter(Boolean))
      })
      .catch(() => setNotFound(true))
  }, [id])

  if (notFound) {
    return <main className="max-w-7xl mx-auto px-6 py-24 text-center text-muted">案例不存在或已下架</main>
  }
  if (!detail) return <Loading />

  const images = [detail.cover_image, ...(detail.gallery || [])].filter(Boolean)

  return (
    <main className="max-w-7xl mx-auto px-6 py-12">
      <Link to="/cases" className="text-sm text-muted hover:text-brass">← 返回案例列表</Link>

      <h1 className="font-serif text-3xl text-ink mt-6 mb-8">{detail.title}</h1>

      {/* 主图 + 缩略图集 */}
      <div className="max-w-4xl">
        <Img src={images[imgIdx]} alt={detail.title} className="w-full aspect-[16/9] rounded-xl" ratio="aspect-[16/9]" />
        {images.length > 1 && (
          <div className="flex gap-3 mt-3 overflow-x-auto">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setImgIdx(i)}
                aria-label={`查看第${i + 1}张图`}
                className={`shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${i === imgIdx ? 'border-brass' : 'border-transparent'}`}
              >
                <Img src={img} alt="" className="w-20 h-20 object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 案例说明（富文本） */}
      {detail.description && (
        <section className="mt-10 max-w-4xl">
          <h2 className="font-serif text-2xl text-ink mb-4">项目说明</h2>
          <div className="bg-white rounded-xl border border-line p-8">
            <ProseHtml html={detail.description} />
          </div>
        </section>
      )}

      {/* 关联产品（可选，P1） */}
      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="font-serif text-2xl text-ink mb-6">本案相关产品</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
            {related.map((p) => (
              <Link key={p.id} to={`/product-detail?id=${p.id}`} className="card-hover block bg-white rounded-xl border border-line overflow-hidden group">
                <Img src={p.cover_image} alt={p.name} className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-500" />
                <p className="p-4 text-center font-serif text-ink group-hover:text-brass transition-colors">{p.name}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
