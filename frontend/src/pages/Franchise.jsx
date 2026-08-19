/**
 * 招商加盟 —— 对齐 UI/UX §5 视图10 / PRD §6.5
 * 功能：加盟政策/品牌优势（后台富文本多条，三栏卡片）+ 招商咨询表单
 */
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchFranchise } from '../api/client'
import InquiryForm from '../components/InquiryForm'
import { EmptyState, Loading, ProseHtml, SectionTitle } from '../components/common'

/** 政策/优势卡片：标题 + 配图 + 富文本内容 */
function FranchiseCard({ f }) {
  return (
    <div className="bg-white rounded-xl border border-line overflow-hidden card-hover">
      {f.image && <img src={f.image} alt={f.title} className="w-full h-44 object-cover" loading="lazy" />}
      <div className="p-6">
        <h3 className="font-serif text-xl text-ink mb-3">{f.title}</h3>
        <ProseHtml html={f.content} />
      </div>
    </div>
  )
}

/** 招商加盟主组件 */
export default function Franchise() {
  const [items, setItems] = useState(null)

  useEffect(() => {
    fetchFranchise()
      .then((r) => setItems(r.items || []))
      .catch(() => setItems([]))
  }, [])

  return (
    <main>
      {/* 页头横幅 */}
      <div className="bg-ink text-center py-20">
        <p className="tracking-[0.3em] text-brass text-sm mb-3">FRANCHISE</p>
        <h1 className="font-serif text-4xl text-cream">招商加盟</h1>
        <p className="text-cream/60 mt-4">携手 D全屋家居，共启高端家居事业</p>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16">
        <SectionTitle en="Advantages" cn="品牌优势与加盟政策" />
        {!items ? (
          <Loading />
        ) : items.length === 0 ? (
          <EmptyState text="政策内容准备中" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {items.map((f) => (
              <FranchiseCard key={f.id} f={f} />
            ))}
          </div>
        )}

        {/* 门店分布入口 */}
        <div className="mt-12 text-center">
          <Link to="/stores" className="inline-block rounded-full bg-brass hover:bg-brass-dark text-white px-10 py-3 transition-colors">
            查看门店分布
          </Link>
        </div>

        {/* 招商咨询表单（两栏布局） */}
        <div className="mt-20 grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <h2 className="font-serif text-3xl text-ink mb-4">加盟咨询</h2>
            <p className="text-muted leading-relaxed">
              如果您有意加盟 D全屋家居，欢迎留下联系方式，招商团队将在 1-3 个工作日内与您联系，
              为您介绍加盟政策与区域支持。
            </p>
          </div>
          <div className="bg-white rounded-xl border border-line p-8">
            <InquiryForm kind="franchise" />
          </div>
        </div>
      </div>
    </main>
  )
}
