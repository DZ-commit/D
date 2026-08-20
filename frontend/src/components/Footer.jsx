/**
 * 页脚 —— 对齐 UI/UX §4.1 / PRD §6.1
 * 功能：联系方式（来自后端 company_contact）+ 导航快捷入口 + 版权
 * 说明：联系信息异步获取，取不到时优雅降级
 */
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchContact } from '../api/client'

// 快捷导航分组（对应站点地图 PRD §5.1）
const GROUPS = [
  {
    title: '产品',
    links: [
      { label: '产品中心', to: '/products' },
      { label: '新案例展示', to: '/cases' },
    ],
  },
  {
    title: '新闻招聘',
    links: [
      { label: '企业新闻', to: '/news?category=company' },
      { label: '社会招聘', to: '/jobs?type=social' },
    ],
  },
  {
    title: '招商加盟',
    links: [
      { label: '加盟政策', to: '/franchise' },
      { label: '门店分布', to: '/stores' },
    ],
  },
  {
    title: '关于我们',
    links: [
      { label: '关于D', to: '/about' },
      { label: '在线预约', to: '/contact?scroll=appointment' },
    ],
  },
]

/** 页脚组件：深色底、四列快捷导航 + 联系方式 + 版权 */
export default function Footer() {
  const [contact, setContact] = useState(null)

  // 加载公司联系信息（页脚展示地址/电话/邮箱）
  useEffect(() => {
    fetchContact().then(setContact).catch(() => setContact(null))
  }, [])

  return (
    <footer className="bg-ink text-cream/80">
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-6 gap-10">
        {/* 品牌区 */}
        <div className="col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-9 h-9 rounded-full bg-brass text-white flex items-center justify-center font-serif">D</span>
            <span className="font-serif text-xl">全屋家居</span>
          </div>
          <p className="text-sm text-cream/60 leading-relaxed">
            高端全屋家居品牌，专注原木家具设计与制造，为您打造温暖的家。
          </p>
          {/* 联系方式（来自后台 company_contact） */}
          <div className="mt-6 space-y-1.5 text-sm text-cream/70">
            {contact?.address && <p>地址：{contact.address}</p>}
            {contact?.phone && <p>电话：{contact.phone}</p>}
            {contact?.email && <p>邮箱：{contact.email}</p>}
          </div>
        </div>

        {/* 快捷导航四列 */}
        {GROUPS.map((g) => (
          <nav key={g.title} aria-label={`页脚-${g.title}`}>
            <p className="text-cream font-medium mb-4">{g.title}</p>
            <ul className="space-y-2.5">
              {g.links.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm text-cream/60 hover:text-brass transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      {/* 版权条 */}
      <div className="border-t border-cream/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-cream/40">
          <p>© {new Date().getFullYear()} D全屋家居 版权所有</p>
          <p>京ICP备00000000号</p>
        </div>
      </div>
    </footer>
  )
}
