/**
 * 顶部导航（sticky）—— 对齐 UI/UX §4.2
 * 功能：Logo（黄铜圆角 D + 衬线品牌名）｜主导航（含下拉二级）｜搜索框｜移动端汉堡折叠
 * 交互：hover 黄铜下划线动画；下拉菜单 hover 展开；移动端 <details> 折叠
 */
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

// 导航数据：label 一级菜单，children 二级项（route 为 hash 路由路径）
const NAV_ITEMS = [
  { label: '首页', to: '/home' },
  {
    label: '产品',
    children: [
      { label: '产品中心', to: '/products' },
      { label: '新案例展示', to: '/cases' },
    ],
  },
  {
    label: '新闻',
    children: [
      { label: '企业新闻', to: '/news', query: 'category=company' },
      { label: '行业资讯', to: '/news', query: 'category=industry' },
    ],
  },
  {
    label: '招聘',
    children: [
      { label: '社会招聘', to: '/jobs', query: 'type=social' },
      { label: '校园招聘', to: '/jobs', query: 'type=campus' },
    ],
  },
  {
    label: '招商加盟',
    children: [
      { label: '加盟政策', to: '/franchise' },
      { label: '门店分布', to: '/stores' },
    ],
  },
  {
    label: '关于我们',
    children: [
      { label: '关于D', to: '/about' },
      { label: '发展历程', to: '/history' },
      { label: '品牌介绍', to: '/brand' },
      { label: '在线预约', to: '/contact', query: 'scroll=appointment' },
      { label: '联系我们', to: '/contact' },
    ],
  },
]

/** Logo：黄铜圆角 D + 品牌名（aria-label 无障碍） */
function Logo() {
  return (
    <Link to="/home" aria-label="D全屋家居首页" className="flex items-center gap-2 shrink-0">
      <span className="w-9 h-9 rounded-full bg-brass text-white flex items-center justify-center font-serif text-lg">
        D
      </span>
      <span className="font-serif text-xl text-ink tracking-wide">全屋家居</span>
    </Link>
  )
}

/** 导航项：无 children 直接链接；有 children 显示下拉菜单 */
function NavItem({ item }) {
  const [open, setOpen] = useState(false)
  if (!item.children) {
    return (
      <Link
        to={item.to}
        className="nav-link relative py-2 text-[15px] text-ink/80 hover:text-ink transition-colors"
      >
        {item.label}
        <span className="absolute left-0 bottom-0 h-px w-full bg-brass origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
      </Link>
    )
  }
  // 下拉菜单：hover 展开淡入下移
  return (
    <div
      className="relative group"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button type="button" className="py-2 text-[15px] text-ink/80 hover:text-ink transition-colors flex items-center gap-1">
        {item.label}
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {/* 下拉面板：白底圆角描边，hover 淡入 */}
      {open && (
        <div className="absolute left-0 top-full pt-3 min-w-[160px] z-50">
          <div className="bg-white rounded-lg shadow-[0_20px_40px_rgba(0,0,0,.08)] border border-line py-2">
            {item.children.map((child) => (
              <Link
                key={child.label}
                to={`${child.to}${child.query ? `?${child.query}` : ''}`}
                className="block px-5 py-2 text-sm text-ink/70 hover:text-brass hover:bg-cream transition-colors"
              >
                {child.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/** 顶部导航（sticky 半透明背景 + 移动端汉堡） */
export default function Navbar() {
  const [q, setQ] = useState('')
  const navigate = useNavigate()

  /** 搜索提交：跳转搜索结果页 */
  const onSearch = (e) => {
    e.preventDefault()
    const kw = q.trim()
    if (kw) navigate(`/search?q=${encodeURIComponent(kw)}`)
  }

  return (
    <header className="sticky top-0 z-40 bg-cream/95 backdrop-blur border-b border-line">
      <div className="max-w-7xl mx-auto px-6 h-[72px] flex items-center justify-between gap-8">
        <Logo />

        {/* 桌面端主导航 */}
        <nav className="hidden lg:flex items-center gap-7" aria-label="主导航">
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.label} item={item} />
          ))}
        </nav>

        {/* 搜索框：胶囊，focus 展开 */}
        <form onSubmit={onSearch} className="hidden md:flex items-center bg-white rounded-full border border-line focus-within:border-brass transition-colors">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索产品/新闻"
            aria-label="站内搜索"
            className="bg-transparent px-4 py-2 text-sm w-44 focus:w-56 transition-all outline-none"
          />
          <button type="submit" aria-label="搜索" className="pr-3 text-muted hover:text-brass">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4-4" strokeLinecap="round" />
            </svg>
          </button>
        </form>

        {/* 移动端汉堡：details 折叠（UI/UX §4.2） */}
        <details className="lg:hidden relative">
          <summary className="list-none cursor-pointer p-2" aria-label="菜单">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-ink" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </summary>
          <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg border border-line shadow-lg py-3 max-h-[70vh] overflow-auto">
            {NAV_ITEMS.map((item) =>
              item.children ? (
                <div key={item.label} className="px-5 py-2">
                  <p className="text-xs text-muted mb-1">{item.label}</p>
                  {item.children.map((c) => (
                    <Link
                      key={c.label}
                      to={`${c.to}${c.query ? `?${c.query}` : ''}`}
                      className="block py-1.5 text-sm text-ink/75 hover:text-brass"
                    >
                      {c.label}
                    </Link>
                  ))}
                </div>
              ) : (
                <Link key={item.label} to={item.to} className="block px-5 py-2 text-sm text-ink/75 hover:text-brass">
                  {item.label}
                </Link>
              ),
            )}
          </div>
        </details>
      </div>
    </header>
  )
}
