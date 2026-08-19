/**
 * 后台管理入口 —— 路由与权限
 * 功能：HashRouter；登录页独立；受保护区域套 AdminLayout；管理员专属路由（招商/关于/改密）做角色守卫
 */
import React from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from './layouts/AdminLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import {
  BannersPage, CasesPage, FranchisePage, JobsPage, NewsPage,
  ProductsPage, SeriesPage, StoresPage,
} from './pages/ContentPages'
import AboutPage from './pages/AboutPage'
import Inquiries from './pages/Inquiries'
import Password from './pages/Password'

/** 角色守卫：非管理员访问管理员专属页时重定向到仪表盘（轻量视图权限，ADR-010） */
function AdminOnly({ children }) {
  const user = JSON.parse(localStorage.getItem('admin_user') || '{}')
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />
  return children
}

/** 后台根组件 */
export default function App() {
  return (
    <HashRouter>
      <Routes>
        {/* 登录页（独立布局） */}
        <Route path="/login" element={<Login />} />
        {/* 受保护区域（侧栏+顶栏布局） */}
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          {/* 内容管理（普通用户可见） */}
          <Route path="series" element={<SeriesPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="cases" element={<CasesPage />} />
          <Route path="news" element={<NewsPage />} />
          <Route path="jobs" element={<JobsPage />} />
          <Route path="banners" element={<BannersPage />} />
          {/* 互动管理（普通用户可见） */}
          <Route path="inquiries" element={<Inquiries />} />
          {/* 管理员专属（招商加盟/关于我们/系统改密） */}
          <Route path="franchise" element={<AdminOnly><FranchisePage /></AdminOnly>} />
          <Route path="about" element={<AdminOnly><AboutPage /></AdminOnly>} />
          <Route path="password" element={<AdminOnly><Password /></AdminOnly>} />
        </Route>
        {/* 兜底 → 登录 */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </HashRouter>
  )
}
