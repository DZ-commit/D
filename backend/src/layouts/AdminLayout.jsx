/**
 * 后台布局 —— 对齐 UI/UX §4.2 / PRD §7.1
 * 功能：
 * - 侧栏（深色 256px）+ 顶栏（白底 sticky：标题/头像/用户名/角色标签/退出）
 * - 双角色菜单可见性：管理员全量；普通用户仅内容管理 + 互动管理（不可见招商加盟/关于我们/系统，ADR-010）
 * - 头像点击可上传（服务端存储 avatar_url，无图回退首字母）
 */
import React, { useEffect, useMemo, useState } from 'react'
import { Avatar, Button, Dropdown, Layout, Menu, Tooltip, Upload } from 'antd'
import {
  AppstoreOutlined, DashboardOutlined, InboxOutlined, LogoutOutlined,
  SettingOutlined, UserOutlined,
} from '@ant-design/icons'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { uploadImage, updateAvatar } from '../api/client'
import ErrorBoundary from '../components/ErrorBoundary'

const { Sider, Header, Content } = Layout

// 菜单配置：adminOnly=true 的项仅管理员可见（轻量级视图权限，非 RBAC）
const MENU = [
  { key: 'dashboard', label: '仪表盘', icon: <DashboardOutlined />, path: '/dashboard' },
  {
    key: 'content',
    label: '内容管理',
    icon: <AppstoreOutlined />,
    children: [
      { key: 'series', label: '产品系列管理', path: '/series' },
      { key: 'products', label: '产品管理', path: '/products' },
      { key: 'cases', label: '案例管理', path: '/cases' },
      { key: 'news', label: '新闻管理', path: '/news' },
      { key: 'jobs', label: '招聘管理', path: '/jobs' },
      { key: 'banners', label: '首页 Banner 管理', path: '/banners' },
      { key: 'franchise', label: '招商加盟管理', path: '/franchise', adminOnly: true },
      { key: 'about', label: '关于我们管理', path: '/about', adminOnly: true },
    ],
  },
  {
    key: 'interaction',
    label: '互动管理',
    icon: <InboxOutlined />,
    children: [{ key: 'inquiries', label: '询盘中心', path: '/inquiries' }],
  },
  {
    key: 'system',
    label: '系统',
    icon: <SettingOutlined />,
    adminOnly: true, // 仅管理员可见（普通用户无改密入口，PRD §7.1）
    children: [{ key: 'password', label: '管理员密码修改', path: '/password' }],
  },
]

/** 根据角色过滤菜单：普通用户移除 adminOnly 项
 * 注意：返回前必须剥离 adminOnly 字段——React 不识别它，若原样传给 AntD Menu，
 *       会被复制到 DOM `<li>` 触发 React 报错并可能导致整页白板
 */
function filterMenu(role) {
  const isAdmin = role === 'admin'
  const filter = (items) =>
    items
      .filter((m) => isAdmin || !m.adminOnly)
      .map((m) => {
        // 递归子项 + 剥离 adminOnly（避免 React unknown DOM prop 警告 → 整页崩溃）
        const { adminOnly, ...rest } = m
        return m.children ? { ...rest, children: filter(m.children) } : rest
      })
      .filter((m) => !m.children || m.children.length > 0)
  return filter(MENU)
}

/** 后台布局主组件 */
export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  // 从 localStorage 读取当前用户（登录时写入）
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('admin_user') || '{}')
    } catch {
      return {}
    }
  }, [location.pathname]) // 路径变化时重新读取（头像更新后刷新）

  // 未登录保护：无 token 跳登录页
  useEffect(() => {
    if (!localStorage.getItem('admin_token')) {
      navigate('/login', { replace: true })
    }
  }, [navigate])

  // 菜单选中项：根据当前路径反查
  const selectedKeys = useMemo(() => {
    const path = location.pathname
    const find = (items) => {
      for (const m of items) {
        if (m.path === path) return m.key
        if (m.children) {
          const r = find(m.children)
          if (r) return r
        }
      }
      return null
    }
    const key = find(MENU)
    return key ? [key] : []
  }, [location.pathname])

  /** 头像上传：成功更新服务端 avatar_url 并刷新本地用户信息 */
  const onAvatarUpload = async (options) => {
    const { file, onSuccess, onError } = options
    try {
      const { url } = await uploadImage(file)
      const me = await updateAvatar(url)
      localStorage.setItem('admin_user', JSON.stringify({
        username: me.username, role: me.role, avatar_url: me.avatar_url,
      }))
      onSuccess({ url })
    } catch (e) {
      onError(e)
    }
  }

  /** 退出登录：清空本地登录态回登录页 */
  const logout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    navigate('/login', { replace: true })
  }

  // 用户首字母（无头像回退，UI/UX §6）
  const initial = (user.username || 'A').charAt(0).toUpperCase()
  const roleLabel = user.role === 'admin' ? '管理员' : user.role === 'user' ? '普通用户' : ''

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 侧栏（深色，256px，可折叠） */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={256}
        style={{ background: '#111827' }}
      >
        {/* 品牌区 */}
        <div className="flex items-center gap-2 px-5 h-16 text-white" style={{ borderBottom: '1px solid rgba(255,255,255,.08)' }}>
          <span className="w-8 h-8 rounded-full flex items-center justify-center font-serif" style={{ background: '#4F46E5' }}>
            D
          </span>
          {!collapsed && <span className="font-medium">D全屋家居 · 后台</span>}
        </div>
        {/* 菜单（按角色过滤，普通用户仅内容+互动） */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={selectedKeys}
          items={filterMenu(user.role)}
          style={{ background: '#111827' }}
          onClick={({ key }) => {
            const find = (items) => {
              for (const m of items) {
                if (m.key === key && m.path) return m.path
                if (m.children) {
                  const r = find(m.children)
                  if (r) return r
                }
              }
              return null
            }
            const path = find(MENU)
            if (path) navigate(path)
          }}
        />
      </Sider>

      <Layout>
        {/* 顶栏：页面标题 + 用户区（头像上传/用户名/角色/退出） */}
        <Header
          style={{
            background: '#fff', padding: '0 24px', display: 'flex',
            alignItems: 'center', justifyContent: 'space-between',
            boxShadow: '0 1px 2px rgba(0,0,0,.05)',
          }}
        >
          <span className="font-medium" style={{ color: '#111827' }}>D全屋家居 · 后台管理</span>

          <div className="flex items-center gap-4">
            {roleLabel && (
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: '#EEF2FF', color: '#4F46E5' }}
              >
                {roleLabel}
              </span>
            )}
            <span style={{ color: '#111827' }}>{user.username}</span>

            {/* 头像：点击上传（AntD Upload 自定义请求），无头像回退首字母 */}
            <Tooltip title="点击上传头像">
              <Upload showUploadList={false} customRequest={onAvatarUpload} accept="image/*">
                <Avatar
                  src={user.avatar_url || undefined}
                  style={{ background: '#4F46E5', cursor: 'pointer' }}
                  icon={!user.avatar_url ? <UserOutlined /> : undefined}
                >
                  {!user.avatar_url ? initial : null}
                </Avatar>
              </Upload>
            </Tooltip>

            <Button type="text" icon={<LogoutOutlined />} onClick={logout}>
              退出
            </Button>
          </div>
        </Header>

        {/* 内容区：子路由渲染（包裹 ErrorBoundary 防止子页面崩溃影响侧栏/顶栏） */}
        <Content style={{ margin: 24, background: '#F3F4F6' }}>
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </Content>
      </Layout>
    </Layout>
  )
}
