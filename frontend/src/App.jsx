/**
 * 前台官网入口 —— 路由与布局（对齐技术文档 §6.2 路由表）
 * 功能：HashRouter（避免静态托管 404）；16 视图路由；Navbar + 页面 + Footer 布局；路由切换滚动复位
 */
import React, { useEffect } from 'react'
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Cases from './pages/Cases'
import CaseDetail from './pages/CaseDetail'
import News from './pages/News'
import NewsDetail from './pages/NewsDetail'
import Jobs from './pages/Jobs'
import JobDetail from './pages/JobDetail'
import Franchise from './pages/Franchise'
import Stores from './pages/Stores'
import About from './pages/About'
import History from './pages/History'
import Brand from './pages/Brand'
import Contact from './pages/Contact'
import Search from './pages/Search'

/** 路由切换时滚动到顶部（除联系页锚点场景） */
function ScrollToTop() {
  const { pathname, search } = useLocation()
  useEffect(() => {
    // 联系页 scroll=appointment 由页面自行平滑滚动，不做强制复位
    if (!(pathname === '/contact' && search.includes('scroll=appointment'))) {
      window.scrollTo(0, 0)
    }
  }, [pathname, search])
  return null
}

/** 前台官网根组件 */
export default function App() {
  return (
    <HashRouter>
      <ScrollToTop />
      <div className="min-h-screen flex flex-col">
        <Navbar />
        {/* 主内容区：flex-1 保证 Footer 吸底 */}
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/product-detail" element={<ProductDetail />} />
            <Route path="/cases" element={<Cases />} />
            <Route path="/case-detail" element={<CaseDetail />} />
            <Route path="/news" element={<News />} />
            <Route path="/news-detail" element={<NewsDetail />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/job-detail" element={<JobDetail />} />
            <Route path="/franchise" element={<Franchise />} />
            <Route path="/stores" element={<Stores />} />
            <Route path="/about" element={<About />} />
            <Route path="/history" element={<History />} />
            <Route path="/brand" element={<Brand />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/search" element={<Search />} />
            {/* 未知路由回首页 */}
            <Route path="*" element={<Home />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </HashRouter>
  )
}
