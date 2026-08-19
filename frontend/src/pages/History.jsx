/**
 * 发展历程 —— 对齐 UI/UX §5 视图13 / PRD §6.6 / §8.9
 * 功能：阶梯时间轴（3 列左右交替、圆形年份节点五色、中线渐变、移动端单列）
 * 说明：数据为后台结构化 JSON [{year, event, image}]（content_pages key=history）
 */
import React, { useEffect, useState } from 'react'
import { fetchAbout } from '../api/client'
import { Img, Loading } from '../components/common'

// 年份 → 节点颜色（UI/UX §3.1 五色阶梯）
const YEAR_COLORS = {
  2018: '#B8925F', // 黄铜（起点）
  2019: '#6B8E7B', // 青绿
  2021: '#6E8CA0', // 灰蓝
  2024: '#A67C52', // 棕褐
  2026: '#8B7355', // 深棕（当下）
}

/** 单节点：年份圆形 + 事件文案（左右交替 + 图片可选） */
function TimelineStep({ item, index }) {
  const color = YEAR_COLORS[item.year] || '#B8925F'
  // 偶数索引左列、奇数右列（3 列网格左右交替）
  const align = index % 2 === 0 ? 'text-right' : 'text-left'
  return (
    <div className={`flex flex-col items-center ${align}`}>
      {/* 年份圆形节点 */}
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center text-white font-serif text-sm shrink-0 shadow-md"
        style={{ backgroundColor: color }}
        aria-label={`${item.year}年`}
      >
        {item.year}
      </div>
      {/* 事件内容 */}
      <div className="mt-4 px-2">
        {item.image && <Img src={item.image} alt={item.event || ''} className="w-40 h-28 object-cover rounded-lg mb-3" />}
        <p className="text-ink text-sm leading-relaxed">{item.event}</p>
      </div>
    </div>
  )
}

/** 发展历程主组件 */
export default function History() {
  const [page, setPage] = useState(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetchAbout('history').then(setPage).catch(() => setNotFound(true))
  }, [])

  if (notFound) {
    return <main className="max-w-4xl mx-auto px-6 py-24 text-center text-muted">内容准备中</main>
  }
  if (!page) return <Loading />

  // 时间轴数据：content 为 JSON 数组 [{year,event,image}]
  const steps = Array.isArray(page.content) ? page.content : []
  if (steps.length === 0) {
    return <main className="max-w-4xl mx-auto px-6 py-24 text-center text-muted">发展历程内容准备中</main>
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-16">
      <h1 className="font-serif text-4xl text-ink text-center mb-16">{page.title || '发展历程'}</h1>

      {/* 阶梯时间轴：3 列 grid 左右交替（UI/UX §4.3），移动端单列 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-y-14 items-start relative">
        {/* 中线渐变（桌面端） */}
        <div
          aria-hidden="true"
          className="hidden md:block absolute top-7 left-[10%] right-[10%] h-0.5"
          style={{ background: 'linear-gradient(to right,#B8925F,#6B8E7B,#6E8CA0,#A67C52,#8B7355)' }}
        />
        {steps.map((item, i) => (
          <TimelineStep key={`${item.year}-${i}`} item={item} index={i} />
        ))}
      </div>
    </main>
  )
}
