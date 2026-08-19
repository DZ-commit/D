/**
 * 首页 —— 对齐 UI/UX §5 视图1 / PRD §6.1
 * 板块：Hero 轮播 + 品牌主张 CTA + 产品系列精选 + 新案例精选 + 新闻精选 + 招商入口
 * 规则：各模块自动取最新/置顶（D5：不设后台推荐位）；空数据优雅占位；数据全部来自后端 API
 */
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchBanners, fetchCases, fetchFranchise, fetchNews, fetchSeries } from '../api/client'
import { EmptyState, Img, Loading, SectionTitle } from '../components/common'

/** Banner 轮播：多图 opacity 淡入（1000ms），遮罩 + 标题白字 + 双 CTA（UI/UX §4.3） */
function Hero({ banners }) {
  const [idx, setIdx] = useState(0)
  // 自动轮播：每 5s 切换下一张（无图则不动）
  useEffect(() => {
    if (banners.length <= 1) return
    const t = setInterval(() => setIdx((i) => (i + 1) % banners.length), 5000)
    return () => clearInterval(t)
  }, [banners.length])

  if (banners.length === 0) {
    return (
      <div className="h-[60vh] bg-gradient-to-br from-brass/20 to-cream flex items-center justify-center">
        <p className="text-muted">品牌视觉即将呈现</p>
      </div>
    )
  }
  const b = banners[idx]
  return (
    <section className="relative h-[86vh] min-h-[480px] overflow-hidden" aria-label="品牌轮播">
      {banners.map((item, i) => (
        <div
          key={item.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${i === idx ? 'opacity-100' : 'opacity-0'}`}
        >
          <Img src={item.image_url} alt={item.title || '品牌宣传图'} className="w-full h-full object-cover" />
        </div>
      ))}
      {/* 黑色半透明遮罩 + 标题文案（UI/UX §4.3） */}
      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
        <div className="text-center text-white px-6">
          <p className="tracking-[0.4em] text-sm text-white/80 mb-4">D 全屋家居</p>
          <h1 className="font-serif text-5xl md:text-6xl mb-6 leading-tight">{b.title || '高端全屋家居'}</h1>
          <div className="flex gap-4 justify-center">
            <Link to="/products" className="rounded-full bg-brass hover:bg-brass-dark px-8 py-3 font-medium transition-colors">
              产品中心
            </Link>
            <Link to="/contact?scroll=appointment" className="rounded-full border border-white/70 hover:bg-white/10 px-8 py-3 font-medium transition-colors">
              在线预约
            </Link>
          </div>
        </div>
      </div>
      {/* 轮播指示点 */}
      {banners.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`切换到第${i + 1}张`}
              className={`w-2 h-2 rounded-full transition-colors ${i === idx ? 'bg-brass' : 'bg-white/50'}`}
            />
          ))}
        </div>
      )}
    </section>
  )
}

/** 产品系列精选卡：封面 + 系列名，点击进产品中心（按系列筛选） */
function SeriesCard({ series }) {
  return (
    <Link
      to={`/products?series_id=${series.id}`}
      className="card-hover block bg-white rounded-xl border border-line overflow-hidden group"
    >
      <Img src={series.cover_image} alt={series.name} className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-500" />
      <div className="p-5 text-center">
        <h3 className="font-serif text-lg text-ink">{series.name}</h3>
        {series.description && <p className="text-sm text-muted mt-1 line-clamp-1">{series.description}</p>}
      </div>
    </Link>
  )
}

/** 新闻精选项：分类/日期 + 标题 */
function NewsMini({ item }) {
  const catLabel = item.category === 'company' ? '企业新闻' : '行业资讯'
  return (
    <Link to={`/news-detail?id=${item.id}`} className="flex items-start gap-4 group py-4 border-b border-line last:border-0">
      <span className="shrink-0 text-xs text-brass border border-brass/40 rounded-full px-2 py-0.5">{catLabel}</span>
      <div className="flex-1">
        <p className="text-[15px] text-ink group-hover:text-brass transition-colors line-clamp-1">{item.title}</p>
        <p className="text-xs text-muted mt-1">{item.publish_date}</p>
      </div>
    </Link>
  )
}

/** 首页主组件：并发拉取各板块数据 */
export default function Home() {
  const [banners, setBanners] = useState(null)
  const [series, setSeries] = useState(null)
  const [cases, setCases] = useState(null)
  const [news, setNews] = useState(null)
  const [franchise, setFranchise] = useState(null)

  // 并发加载首页全部板块数据（Promise.all）
  useEffect(() => {
    Promise.all([
      fetchBanners(),
      fetchSeries(),
      fetchCases({ pageSize: 6 }),
      fetchNews({ pageSize: 4 }),
      fetchFranchise(),
    ])
      .then(([b, s, c, n, f]) => {
        setBanners(b.items || [])
        setSeries(s.items || [])
        setCases(c.items || [])
        setNews(n.items || [])
        setFranchise(f.items || [])
      })
      .catch(() => {
        // 任一板块失败不阻塞整页：置空数组走空态
        setBanners([]); setSeries([]); setCases([]); setNews([]); setFranchise([])
      })
  }, [])

  // 首屏等待（仅 banner 决定首屏骨架）
  if (banners === null) return <Loading />

  return (
    <main>
      <Hero banners={banners} />

      {/* 产品系列精选：自动取系列前 4（D5） */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <SectionTitle en="Product Series" cn="产品系列" />
        {series.length === 0 ? (
          <EmptyState text="系列内容准备中" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {series.slice(0, 4).map((s) => (
              <SeriesCard key={s.id} series={s} />
            ))}
          </div>
        )}
        <div className="text-center mt-10">
          <Link to="/products" className="inline-block rounded-full border border-brass text-brass hover:bg-brass hover:text-white px-8 py-2.5 transition-colors">
            查看全部产品
          </Link>
        </div>
      </section>

      {/* 新案例精选：最新 3 条（D5） */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <SectionTitle en="New Projects" cn="新案例展示" />
          {cases.length === 0 ? (
            <EmptyState text="案例准备中" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {cases.slice(0, 3).map((c) => (
                <Link key={c.id} to={`/case-detail?id=${c.id}`} className="card-hover block bg-cream rounded-xl overflow-hidden group">
                  <Img src={c.cover_image} alt={c.title} className="w-full aspect-[16/10] object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="p-5">
                    <h3 className="font-serif text-lg text-ink group-hover:text-brass transition-colors">{c.title}</h3>
                    {c.description && <p className="text-sm text-muted mt-1 line-clamp-2">{c.description}</p>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 新闻动态精选 + 招商入口（两栏） */}
      <section className="max-w-7xl mx-auto px-6 py-16 grid lg:grid-cols-2 gap-12">
        <div>
          <SectionTitle en="News" cn="新闻动态" />
          {news.length === 0 ? (
            <EmptyState text="暂无新闻" />
          ) : (
            <div>{news.map((n) => <NewsMini key={n.id} item={n} />)}</div>
          )}
          <Link to="/news" className="text-sm text-brass hover:text-brass-dark mt-4 inline-block">更多新闻 →</Link>
        </div>
        <div>
          <SectionTitle en="Franchise" cn="招商加盟" />
          {/* 政策亮点卡（后台招商内容） */}
          <div className="space-y-4">
            {franchise.slice(0, 2).map((f) => (
              <div key={f.id} className="bg-white rounded-xl border border-line p-6">
                <h3 className="font-serif text-lg text-ink mb-2">{f.title}</h3>
                <div className="text-sm text-muted line-clamp-2" dangerouslySetInnerHTML={{ __html: f.content || '' }} />
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-6">
            <Link to="/franchise" className="rounded-full border border-brass text-brass hover:bg-brass hover:text-white px-6 py-2.5 text-sm transition-colors">
              加盟政策
            </Link>
            <Link to="/stores" className="rounded-full border border-brass text-brass hover:bg-brass hover:text-white px-6 py-2.5 text-sm transition-colors">
              门店分布
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
