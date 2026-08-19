/**
 * 产品详情 —— 对齐 UI/UX §5 视图3 / PRD §6.2.1
 * 功能：大图轮播（封面+图集）、信息卡（名称/编号/系列/空间标签）、规格参数表、图文详情、预约 CTA
 */
import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { fetchProduct } from '../api/client'
import { Badge, Img, Loading, ProseHtml } from '../components/common'

// 空间分类常量（与产品中心一致）
const CATEGORIES = { 1: '客厅', 2: '卧室', 3: '书房', 4: '茶室' }

/** 主图切换：图集含封面，可点击缩略图切换 */
export default function ProductDetail() {
  const [params] = useSearchParams()
  const id = params.get('id')
  const [product, setProduct] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [imgIdx, setImgIdx] = useState(0)

  // 加载产品详情
  useEffect(() => {
    if (!id) return
    setProduct(null)
    setNotFound(false)
    fetchProduct(id)
      .then(setProduct)
      .catch(() => setNotFound(true))
  }, [id])

  if (notFound) {
    return <main className="max-w-7xl mx-auto px-6 py-24 text-center text-muted">产品不存在或已下架</main>
  }
  if (!product) return <Loading />

  // 图集：封面 + gallery（去重）
  const images = [product.cover_image, ...(product.gallery || [])].filter(Boolean)
  const catName = CATEGORIES[product.category_id]

  return (
    <main className="max-w-7xl mx-auto px-6 py-12">
      {/* 返回列表 */}
      <Link to="/products" className="text-sm text-muted hover:text-brass">← 返回产品中心</Link>

      <div className="mt-6 grid lg:grid-cols-2 gap-10">
        {/* 左侧：大图 + 缩略图集 */}
        <div>
          <Img src={images[imgIdx]} alt={product.name} className="w-full aspect-[4/3] rounded-xl" ratio="aspect-[4/3]" />
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

        {/* 右侧：信息卡（UI/UX §4.3） */}
        <div className="bg-white rounded-xl border border-line p-8 h-fit">
          <h1 className="font-serif text-3xl text-ink">{product.name}</h1>
          <div className="flex flex-wrap gap-2 mt-3 text-sm">
            <Badge>{product.series_name || '未分类系列'}</Badge>
            {catName && <Badge>{catName}</Badge>}
            {product.is_top === 1 && <Badge>推荐</Badge>}
          </div>
          <p className="text-xs text-muted mt-3">产品编号：{product.product_no}</p>

          {/* 规格参数表（可选，JSON） */}
          {product.specs && Object.keys(product.specs).length > 0 && (
            <div className="mt-6">
              <h2 className="text-sm font-medium text-ink mb-3">规格参数</h2>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                {Object.entries(product.specs).map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-line pb-1.5">
                    <dt className="text-muted">{k}</dt>
                    <dd className="text-ink">{String(v)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* 预约 CTA */}
          <Link
            to="/contact?scroll=appointment"
            className="mt-8 inline-block rounded-full bg-brass hover:bg-brass-dark text-white px-10 py-3 font-medium transition-colors"
          >
            预约咨询
          </Link>
        </div>
      </div>

      {/* 图文详情（富文本，后端已净化） */}
      {product.description && (
        <section className="mt-12">
          <h2 className="font-serif text-2xl text-ink mb-6">产品详情</h2>
          <div className="bg-white rounded-xl border border-line p-8">
            <ProseHtml html={product.description} />
          </div>
        </section>
      )}
    </main>
  )
}
